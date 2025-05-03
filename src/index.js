// LandiWetter MCP Server
// This server provides Swiss weather forecast data from LandiWetter API

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

// Create an MCP server
const server = new McpServer({
  name: "LandiWetter-MCP",
  version: "1.0.0"
});

// Helper function to format date as yyyy-MM-dd
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Helper function to search for locations
async function searchLocation(locationName) {
  try {
    const response = await axios.get(`https://www.landi.ch/weather/api/geosuche/de/${encodeURIComponent(locationName)}`);
    console.error('Search Location API Response:', JSON.stringify(response.data, null, 2));
    return response.data.orte || [];
  } catch (error) {
    console.error("Error searching for location:", error.message);
    return [];
  }
}

// Helper function to get weather forecast
async function getWeatherForecast(locationId, date) {
  try {
    const formattedDate = formatDate(date);
    const url = `https://www.landi.ch/weather/api/lokalprognose/de/${formattedDate}/${locationId}`;
    console.error('Weather API URL:', url);
    const response = await axios.get(url);
    console.error('Weather API Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error("Error fetching weather forecast:", error.message);
    throw new Error(`Failed to fetch weather forecast: ${error.message}`);
  }
}

// Add a tool to search for locations
server.tool(
  "searchLocation",
  { locationName: z.string().describe("The name of the location to search for") },
  async ({ locationName }) => {
    const locations = await searchLocation(locationName);
    
    if (locations.length === 0) {
      return {
        content: [{ 
          type: "text", 
          text: `No locations found for "${locationName}".` 
        }]
      };
    }

    const formattedLocations = locations.map(loc => 
      `${loc.name}${loc.plz ? ` (${loc.plz})` : ''}, ${loc.land} - ID: ${loc.id}`
    ).join('\n');

    return {
      content: [{ 
        type: "text", 
        text: `Found ${locations.length} location(s):\n\n${formattedLocations}` 
      }]
    };
  }
);

// Add a tool to get current weather forecast
server.tool(
  "getWeatherForecast",
  { 
    locationId: z.string().describe("The location ID (e.g., G2661552)"),
    date: z.string().optional().describe("Optional: The date for the forecast (yyyy-MM-dd). Defaults to today")
  },
  async ({ locationId, date }) => {
    try {
      // Use provided date or default to today
      const forecastDate = date ? new Date(date) : new Date();
      
      // Validate date
      if (isNaN(forecastDate.getTime())) {
        return {
          content: [{ type: "text", text: "Invalid date format. Please use yyyy-MM-dd." }],
          isError: true
        };
      }
      
      const forecast = await getWeatherForecast(locationId, forecastDate);
      
      // Handle error if forecast data is incomplete
      if (!forecast || !forecast.datum) {
        console.error('Invalid forecast data:', forecast);
        return {
          content: [{ type: "text", text: "Received invalid forecast data from API." }],
          isError: true
        };
      }
      
      // Format the response nicely using the actual structure
      let formattedForecast = `Weather Forecast for date ${forecast.datum}:\n\n`;
      
      // Add general weather overview for the whole day
      if (forecast.ganzertag) {
        const dayData = forecast.ganzertag;
        formattedForecast += `### Daily Overview\n`;
        formattedForecast += `Temperature: ${dayData.uebersicht.mintemp} to ${dayData.uebersicht.maxtemp}\n`;
        formattedForecast += `Precipitation: ${dayData.niederschlag.menge} (Probability: ${dayData.niederschlag.wahrscheinlichkeit})\n`;
        formattedForecast += `Cloud coverage: ${dayData.niederschlag.wolken}\n`;
        formattedForecast += `Wind: ${dayData.wind.geschwindigkeit} from ${dayData.wind.richtung}\n`;
        formattedForecast += `Sunshine duration: ${dayData.sonne.dauer}\n\n`;
      }
      
      // Add time sections for detailed forecast
      if (forecast.abschnitte && forecast.abschnitte.length > 0) {
        formattedForecast += `### Hourly Forecast\n`;
        
        forecast.abschnitte.forEach(section => {
          formattedForecast += `\n${section.zeitvon} - ${section.zeitbis}:\n`;
          formattedForecast += `Temperature: ${section.uebersicht.mintemp} to ${section.uebersicht.maxtemp}\n`;
          formattedForecast += `Precipitation: ${section.niederschlag.menge} (Probability: ${section.niederschlag.wahrscheinlichkeit})\n`;
          formattedForecast += `Wind: ${section.wind.geschwindigkeit} from ${section.wind.richtung}\n`;
        });
      }
      
      // Add general weather situation and outlook if available
      if (forecast.allgemeineLage) {
        formattedForecast += `\n### General Weather Situation\n${forecast.allgemeineLage}\n`;
      }
      
      if (forecast.aussichten) {
        formattedForecast += `\n### Outlook\n${forecast.aussichten}\n`;
      }
      
      return {
        content: [{ type: "text", text: formattedForecast }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

// Add a resource to provide the weather forecast by location name and date
server.resource(
  "weather-forecast",
  new ResourceTemplate("weather://{location}/{date}", { list: undefined }),
  async (uri, { location, date }) => {
    try {
      // Search for the location
      const locations = await searchLocation(location);
      
      if (locations.length === 0) {
        return {
          contents: [{
            uri: uri.href,
            text: `No locations found for "${location}".`
          }]
        };
      }
      
      // Use the first location
      const locationId = locations[0].id;
      
      // Parse date or use today
      const forecastDate = date ? new Date(date) : new Date();
      
      // Validate date
      if (isNaN(forecastDate.getTime())) {
        return {
          contents: [{
            uri: uri.href,
            text: "Invalid date format. Please use yyyy-MM-dd."
          }]
        };
      }
      
      // Get the forecast
      const forecast = await getWeatherForecast(locationId, forecastDate);
      
      // Handle error if forecast data is incomplete
      if (!forecast || !forecast.datum) {
        console.error('Invalid forecast data:', forecast);
        return {
          contents: [{
            uri: uri.href,
            text: "Received invalid forecast data from API."
          }]
        };
      }
      
      // Format the response using the actual structure
      let formattedForecast = `Weather Forecast for ${locations[0].name} (${locations[0].land}) on ${forecast.datum}:\n\n`;
      
      // Add general weather overview for the whole day
      if (forecast.ganzertag) {
        const dayData = forecast.ganzertag;
        formattedForecast += `### Daily Overview\n`;
        formattedForecast += `Temperature: ${dayData.uebersicht.mintemp} to ${dayData.uebersicht.maxtemp}\n`;
        formattedForecast += `Precipitation: ${dayData.niederschlag.menge} (Probability: ${dayData.niederschlag.wahrscheinlichkeit})\n`;
        formattedForecast += `Cloud coverage: ${dayData.niederschlag.wolken}\n`;
        formattedForecast += `Wind: ${dayData.wind.geschwindigkeit} from ${dayData.wind.richtung}\n`;
        formattedForecast += `Sunshine duration: ${dayData.sonne.dauer}\n\n`;
      }
      
      // Add time sections for detailed forecast
      if (forecast.abschnitte && forecast.abschnitte.length > 0) {
        formattedForecast += `### Hourly Forecast\n`;
        
        forecast.abschnitte.forEach(section => {
          formattedForecast += `\n${section.zeitvon} - ${section.zeitbis}:\n`;
          formattedForecast += `Temperature: ${section.uebersicht.mintemp} to ${section.uebersicht.maxtemp}\n`;
          formattedForecast += `Precipitation: ${section.niederschlag.menge} (Probability: ${section.niederschlag.wahrscheinlichkeit})\n`;
          formattedForecast += `Wind: ${section.wind.geschwindigkeit} from ${section.wind.richtung}\n`;
        });
      }
      
      // Add general weather situation and outlook if available
      if (forecast.allgemeineLage) {
        formattedForecast += `\n### General Weather Situation\n${forecast.allgemeineLage}\n`;
      }
      
      if (forecast.aussichten) {
        formattedForecast += `\n### Outlook\n${forecast.aussichten}\n`;
      }
      
      return {
        contents: [{
          uri: uri.href,
          text: formattedForecast
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error: ${error.message}`
        }]
      };
    }
  }
);

// Start the server on stdio
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error("LandiWetter MCP server started");
}).catch(error => {
  console.error("Failed to start MCP server:", error);
}); 