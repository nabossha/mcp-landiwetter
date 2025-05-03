// Simple HTTP wrapper for testing the MCP server
import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

const mcpProcess = spawn('node', [join(__dirname, 'index.js')]);
let initialized = false;
let messageHandlers = new Map();

// Handle communication with MCP subprocess
mcpProcess.stdout.on('data', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('MCP Response:', JSON.stringify(message, null, 2));
    
    // Store initialization response
    if (message.result && message.result.serverInfo && !initialized) {
      initialized = true;
      console.log('MCP Server initialized successfully');
    }
    
    // Call the appropriate handler if registered
    if (message.id && messageHandlers.has(message.id)) {
      const handler = messageHandlers.get(message.id);
      handler(message);
      messageHandlers.delete(message.id);
    }
  } catch (error) {
    console.error('Error processing MCP response:', error);
  }
});

// Log errors
mcpProcess.stderr.on('data', (data) => {
  console.error('MCP Server stderr:', data.toString());
});

// Handle process exit
mcpProcess.on('close', (code) => {
  console.log(`MCP process exited with code ${code}`);
});

// Initialize the MCP server when our HTTP server starts
function initializeMcp() {
  const initMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      clientInfo: {
        name: 'curl-test-client',
        version: '1.0.0'
      },
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      }
    }
  };
  
  mcpProcess.stdin.write(JSON.stringify(initMessage) + '\n');
}

// Helper function to send MCP requests
function sendMcpRequest(message, callback) {
  messageHandlers.set(message.id, callback);
  mcpProcess.stdin.write(JSON.stringify(message) + '\n');
}

// Endpoint to list tools
app.get('/tools', (req, res) => {
  const listToolsMessage = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/list',
    params: {}
  };
  
  sendMcpRequest(listToolsMessage, (response) => {
    if (response.result) {
      res.json(response.result);
    } else if (response.error) {
      res.status(500).json(response.error);
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  });
});

// Endpoint to search for a location
app.get('/search/:location', (req, res) => {
  const callToolMessage = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: 'searchLocation',
      arguments: {
        locationName: req.params.location
      }
    }
  };
  
  sendMcpRequest(callToolMessage, (response) => {
    if (response.result) {
      res.json(response.result);
    } else if (response.error) {
      res.status(500).json(response.error);
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  });
});

// Endpoint to get weather forecast with optional date
app.get('/forecast/:locationId', (req, res) => {
  const callToolMessage = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: 'getWeatherForecast',
      arguments: {
        locationId: req.params.locationId,
        date: req.query.date
      }
    }
  };
  
  sendMcpRequest(callToolMessage, (response) => {
    if (response.result) {
      res.json(response.result);
    } else if (response.error) {
      res.status(500).json(response.error);
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test server listening on port ${PORT}`);
  initializeMcp();
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  mcpProcess.kill();
  process.exit();
}); 