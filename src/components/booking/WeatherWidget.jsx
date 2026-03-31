import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const LOCATION_COORDS = {
  ixtapa_zihuatanejo: { lat: 17.6617, lon: -101.5528, city: 'Zihuatanejo' },
  acapulco: { lat: 16.8531, lon: -99.8237, city: 'Acapulco' },
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

export default function WeatherWidget({ locationId }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!locationId || !LOCATION_COORDS[locationId]) return;
    const { lat, lon, city } = LOCATION_COORDS[locationId];

    base44.integrations.Core.InvokeLLM({
      prompt: `Get the current real-time weather for ${city}, Mexico (lat ${lat}, lon ${lon}). Return ONLY a JSON with: temp_c (number, current temperature in Celsius), condition (string, one word: Clear/Sunny/Clouds/Rain/Drizzle/Thunderstorm/Mist/Fog/Haze), description (short phrase like "Partly cloudy"). Use real weather data from your knowledge of typical conditions or internet context.`,
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
      if (result?.temp_c !== undefined) {
        setWeather(result);
      }
    }).catch(() => {});
  }, [locationId]);

  if (!weather) return null;

  const tempF = Math.round(weather.temp_c * 9 / 5 + 32);
  const icon = weatherIcons[weather.condition] || '🌤️';

  return (
    <div className="flex items-center gap-1.5 text-xs text-cyan-300/80 font-mono mt-1">
      <span>{icon}</span>
      <span>{weather.description}</span>
      <span className="text-white/60">·</span>
      <span className="text-white/80">{Math.round(weather.temp_c)}°C / {tempF}°F</span>
    </div>
  );
}