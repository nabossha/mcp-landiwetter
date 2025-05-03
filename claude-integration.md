# Integrating LandiWetter MCP Server with Claude Desktop

This guide explains how to set up and use the LandiWetter MCP server with Claude Desktop to get Swiss weather forecasts directly in your chats.

## Prerequisites

- Claude Desktop installed on your computer
- Node.js v16 or newer installed
- LandiWetter MCP Server downloaded and installed

## Setup Steps

### 1. Install the LandiWetter MCP Server

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/landiwetter-mcp.git
   cd landiwetter-mcp
   ```

2. Install dependencies:
   ```
   npm install
   ```

### 2. Configure Claude Desktop

1. Open Claude Desktop
2. Go to Settings (gear icon in the bottom left)
3. Click on the "MCP" tab
4. Click "Add custom server"
5. Enter the following information:
   - **Name**: LandiWetter
   - **Command**: `node /full/path/to/landiwetter-mcp/src/index.js`
     (Replace `/full/path/to/` with the actual path on your computer)
6. Click "Save"
7. Toggle the switch to enable the server

### 3. Verify Integration

To verify that the integration is working:

1. Start a new chat in Claude Desktop
2. Type: `Please search for Swiss locations named "Zürich"`
3. Claude should use the MCP server to search for locations and return a formatted list

## Using the Weather Forecast

### Example Prompts

You can use natural language to ask for weather information:

#### Search for locations:
```
Can you find Swiss locations called "Bern"?
```

#### Get current weather:
```
What's the weather like in Zürich today?
```

#### Get weather forecast for a specific date:
```
What will the weather be like in Bern on May 10th, 2025?
```

#### Get detailed forecast:
```
Give me a detailed hourly weather forecast for Zürich for tomorrow.
```

### Viewing Resource Content

You can also directly reference resources:

```
Please show me the content of weather://Bern/2025-05-03
```

## Troubleshooting

If you encounter issues with the MCP integration:

1. **Server not found**: Ensure the path to the server is correct in the Claude Desktop settings
2. **API errors**: Check your internet connection since the server needs to connect to the LandiWetter API
3. **Command not running**: Make sure Node.js is installed and in your system PATH

## Advanced Usage

### Location IDs

After you search for a location, you'll get back location IDs. You can use these directly for more precise forecasts:

```
Please get the weather forecast for location ID G2661552
```

### Filtering Results

You can be specific about what information you want:

```
What's the precipitation probability in Zürich for tomorrow?
```

This allows Claude to extract just the information you need from the rich weather data.

## Conclusion

The LandiWetter MCP server enhances Claude Desktop with the ability to provide accurate Swiss weather forecasts. By following this guide, you can get meteorological information directly in your chats without leaving the Claude interface. 