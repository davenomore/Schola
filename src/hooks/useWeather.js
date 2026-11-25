import { useState, useEffect } from 'react';

export function useWeather(enabled) {
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLocation, setWeatherLocation] = useState('Keresés...');

  useEffect(() => {
    if (!enabled) return;

    const fetchWeatherData = async (lat = 47.4984, lon = 19.0404, defaultLoc = 'Budapest') => {
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const weatherJson = await weatherRes.json();

        if (weatherJson && weatherJson.current_weather) {
          setWeatherData(weatherJson.current_weather);
        }

        if (lat !== 47.4984 || lon !== 19.0404) {
          const locRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=hu`
          );
          const locJson = await locRes.json();
          setWeatherLocation(locJson.city || locJson.locality || defaultLoc);
        } else {
          setWeatherLocation(defaultLoc);
        }
      } catch (err) {
        console.error('Failed to fetch weather data', err);
        setWeatherLocation(defaultLoc);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherData(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          // Ha a böngésző nem engedélyezi a helymeghatározást, alapértelmezettként Budapestet használjuk
          fetchWeatherData();
        },
        { timeout: 10000 }
      );
    } else {
      fetchWeatherData();
    }
  }, [enabled]);

  return { weatherData, weatherLocation };
}
