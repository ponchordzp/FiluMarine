import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const LOCATION_COORDS = {
  ixtapa_zihuatanejo: { lat: 17.6617, lon: -101.5528, city: 'Zihuatanejo' },
  acapulco: { lat: 16.8531, lon: -99.8237, city: 'Acapulco' },
  cancun: { lat: 21.1619, lon: -86.8515, city: 'Cancún' },
};

const weatherIcons = {
  'Clear': '☀️',
  'Sunny': '☀️',
  'Clouds': '⛅',
  'Rain': '🌧️',
  'Drizzle': '🌦️',
  'Thunderstorm': '⛈️',
  'Snow': '❄️',
  'Mist': '🌫️',
  'Fog': '🌫️',
  'Haze': '🌫️',
};

export default function WeatherWidget({ locationId, coordinates }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    let lat, lon, city = 'Location';

    // If coordinates string is provided (e.g., "17.6617°N, 101.5528°W")
    if (coordinates) {
      const match = coordinates.match(/(\d+\.\d+)[°]?([NS])?,?\s*(\d+\.\d+)[°]?([EW])?/);
      if (match) {
        lat = parseFloat(match[1]) * (match[2] === 'S' ? -1 : 1);
        lon = parseFloat(match[3]) * (match[4] === 'W' ? -1 : 1);
      } else {
        return;
      }
    } else if (locationId && LOCATION_COORDS[locationId]) {
      const loc = LOCATION_COORDS[locationId];
      lat = loc.lat;
      lon = loc.lon;
      city = loc.city;
    } else {
      return;
    }

    base44.integrations.Core.InvokeLLM({
      prompt: `Get the current real-time weather at coordinates (lat ${lat.toFixed(4)}, lon ${lon.toFixed(4)}). Return ONLY a JSON with: temp_c (number, current temperature in Celsius), condition (string, one word: Clear/Sunny/Clouds/Rain/Drizzle/Thunderstorm/Mist/Fog/Haze), description (short phrase like "Partly cloudy"). Use real weather data.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          temp_c: { type: 'number' },
          condition: { type: 'string' },
          description: { type: 'string' },
        },
      },
    }).then((result) => {
      if (result?.data?.temp_c !== undefined) {
        setWeather(result.data);
      } else if (result?.temp_c !== undefined) {
        setWeather(result);
      }
    }).catch(() => {});
  }, [locationId, coordinates]);

  if (!weather) {
    return (
      <div className="flex items-center justify-center h-full text-white/40 text-xs">
        <p>Loading weather...</p>
      </div>
    );
  }

  const tempF = Math.round(weather.temp_c * 9 / 5 + 32);
  const icon = weatherIcons[weather.condition] || '🌤️';

  return (
    <div className="p-4 h-full flex flex-col justify-center space-y-2">
      <h4 className="text-sm font-semibold text-blue-300">Weather</h4>
      <div className="flex items-center gap-2">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <p className="text-white font-medium text-sm">{weather.description}</p>
          <p className="text-white/70 text-xs">{Math.round(weather.temp_c)}°C / {tempF}°F</p>
        </div>
      </div>
    </div>
  );
}