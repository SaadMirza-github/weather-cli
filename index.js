#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');

// Function to display help message
function showHelp() {
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
const args = process.argv.slice(2);
if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
}

const address = args.join(' ');

// Function to get coordinates from address using Open-Meteo Geocoding API
async function getCoordinates(address) {
    try {
        const response = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
            params: {
                name: address,
                count: 1,
                language: 'en',
                format: 'json'
            }
        });
        
        if (!response.data.results || response.data.results.length === 0) {
            throw new Error('No results found for the given address');
        }

        const { latitude, longitude, name } = response.data.results[0];
        return { latitude, longitude, locationName: name };
    } catch (error) {
        throw new Error(`Geocoding error: ${error.message}`);
    }
}

// Function to get weather data using Open-Meteo Weather API
async function getWeather(latitude, longitude) {
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
        return response.data.current_weather;
    } catch (error) {
        throw new Error(`Weather API error: ${error.message}`);
    }
}

// Main function to fetch and display weather information
async function main() {
    try {
        console.log(chalk.blue('Fetching weather data...'));

        // Get coordinates
        const { latitude, longitude, locationName } = await getCoordinates(address);
        console.log(chalk.green(`Coordinates for ${address}:`));
        console.log(chalk.cyan(`Latitude: ${latitude}`));
        console.log(chalk.cyan(`Longitude: ${longitude}`));

        // Get weather
        const weatherData = await getWeather(latitude, longitude);
        
        // Display weather information
        console.log(chalk.green('\nWeather Information:'));
        console.log(chalk.cyan(`Location: ${locationName}`));
        console.log(chalk.cyan(`Temperature: ${weatherData.temperature}°C`));
        console.log(chalk.cyan(`Weather: ${getWeatherDescription(weatherData.weathercode)}`));
        console.log(chalk.cyan(`Wind Speed: ${weatherData.windspeed} m/s`));
    } catch (error) {
        console.error(chalk.red('Error:', error.message));
        process.exit(1);
    }
}

// Helper function to convert Open-Meteo weather codes to descriptions
function getWeatherDescription(code) {
    const weatherCodes = {
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