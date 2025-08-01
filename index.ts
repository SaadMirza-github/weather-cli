#!/usr/bin/env node

import axios from 'axios';
import chalk from 'chalk';

// Interface for Open-Meteo geocoding response
interface GeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

// Interface for Open-Meteo weather response
interface WeatherData {
  temperature: number;
  weathercode: number;
  windspeed: number;
}

// Function to display help message
function showHelp(): void {
  console.log(chalk.yellow(`
Weather CLI Utility
Usage: node index.js <address>

Options:
  -h, --help    Show this help message and exit

Example:
  node index.js "1600 Amphitheatre Parkway, Mountain View, CA"
`));
  process.exit(0);
}

// Parse command-line arguments
const args: string[] = process.argv.slice(2);
if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  showHelp();
}

const address: string = args.join(' ');

// Function to get coordinates from address using Open-Meteo Geocoding API
async function getCoordinates(address: string): Promise<{ latitude: number; longitude: number; locationName: string }> {
  try {
    const response = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: {
        name: address,
        count: 1,
        language: 'en',
        format: 'json'
      }
    });
    const data: GeocodingResponse = response.data;
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No results found for the given address');
    }

    const { latitude, longitude, name } = data.results[0];
    return { latitude, longitude, locationName: name };
  } catch (error: any) {
    throw new Error(`Geocoding error: ${error.message}`);
  }
}

// Function to get weather data using Open-Meteo Weather API
async function getWeather(latitude: number, longitude: number): Promise<WeatherData> {
  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        current_weather: true,
        temperature_unit: 'celsius',
        windspeed_unit: 'ms'
      }
    });
    const data: { current_weather: WeatherData } = response.data;
    return data.current_weather;
  } catch (error: any) {
    throw new Error(`Weather API error: ${error.message}`);
  }
}

// Main function to fetch and display weather information
async function main(): Promise<void> {
  try {
    console.log(chalk.blue('Fetching weather data...'));

    // Get coordinates
    const { latitude, longitude, locationName } = await getCoordinates(address);
    console.log(chalk.green(`Coordinates for ${address}:`));
    console.log(chalk.cyan(`Latitude: ${latitude}`));
    console.log(chalk.cyan(`Longitude: ${longitude}`));

    // Get weather
    const weatherData: WeatherData = await getWeather(latitude, longitude);
    
    // Display weather information
    console.log(chalk.green('\nWeather Information:'));
    console.log(chalk.cyan(`Location: ${locationName}`));
    console.log(chalk.cyan(`Temperature: ${weatherData.temperature}°C`));
    console.log(chalk.cyan(`Weather: ${getWeatherDescription(weatherData.weathercode)}`));
    console.log(chalk.cyan(`Wind Speed: ${weatherData.windspeed} m/s`));
  } catch (error: any) {
    console.error(chalk.red('Error: ' + error.message));
    process.exit(1);
  }
}

// Helper function to convert Open-Meteo weather codes to descriptions
function getWeatherDescription(code: number): string {
  const weatherCodes: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain'
  };
  return weatherCodes[code] || 'Unknown';
}

// Execute main function
main();