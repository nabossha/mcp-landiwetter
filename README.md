# LandiWetter MCP Server

This is a Model Context Protocol (MCP) server that provides Swiss weather forecast data from LandiWetter. The server allows you to search for Swiss locations and get detailed weather forecasts.

## Features

- Search for Swiss locations by name
- Get detailed weather forecasts for a specific location and date
- Access both hourly and daily forecast data
- Use as a tool or resource in MCP-compatible clients

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

## Usage

### Starting the Server

Run the server with:

```
npm start
```

This starts the MCP server using the stdio transport, making it compatible with MCP clients like Claude Desktop.

### Integrating with Claude Desktop

1. Open Claude Desktop
2. Go to Settings > MCP > Add custom server
3. Configure with the following details:
   - Name: LandiWetter
   - Command: `node /path/to/landiwetter-mcp/src/index.js`
4. Save and enable the server

### Example Claude Prompts

Once the server is integrated with Claude Desktop, you can use natural language prompts to access weather forecasts:

**To get a weather forecast:**
```
What's the weather forecast for Bern, Switzerland?
```

**To get a weather forecast for a specific date:**
```
What's the weather forecast for Zürich on 2025-05-10?
```

## Available Tools

### searchLocation

Search for Swiss locations by name.

Parameters:
- `locationName`: The name of the location to search for

Example:
```
Please search for locations named "Zürich"
```

### getWeatherForecast

Get a detailed weather forecast for a specific location.

Parameters:
- `locationId`: The location ID (e.g., G2661552)
- `date` (optional): The date for the forecast (yyyy-MM-dd). Defaults to today

Example:
```
Please get the weather forecast for location ID G2661552
```

## Available Resources

### weather-forecast

Access weather forecasts through a resource URI.

URI Template: `weather://{location}/{date}`

Where:
- `location`: The name of the location (e.g., "Zürich")
- `date` (optional): The date for the forecast (yyyy-MM-dd). Defaults to today

Example:
```
Please check the resource at weather://Zürich/2025-05-03
```