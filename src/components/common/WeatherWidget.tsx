import { useEffect, useState } from 'react'
import { Cloud, CloudRain, Sun, Wind, Droplets } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ReactNode } from 'react'

interface WeatherData {
  temp: number
  condition: string
  humidity: number
  windSpeed: number
  location: string
  icon: string
}

const weatherIcons: Record<string, ReactNode> = {
  'clear': <Sun className="h-5 w-5 text-yellow-500" />,
  'clouds': <Cloud className="h-5 w-5 text-gray-400" />,
  'rain': <CloudRain className="h-5 w-5 text-blue-400" />,
  'drizzle': <CloudRain className="h-5 w-5 text-blue-300" />,
  'thunderstorm': <CloudRain className="h-5 w-5 text-blue-600" />,
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Get user's location
        if (!navigator.geolocation) {
          setError('Geolocation not supported')
          setLoading(false)
          return
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            
            // Fetch weather data from Open-Meteo API (free, no key required)
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
            )
            
            if (!response.ok) throw new Error('Weather fetch failed')
            
            const data = await response.json()
            const current = data.current
            
            // Get location name (reverse geocoding)
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            )
            const geoData = await geoResponse.json()
            const locationName = geoData.address?.city || geoData.address?.town || 'Current Location'
            
            // Map weather codes to conditions
            const weatherCode = current.weather_code
            let condition = 'clear'
            if (weatherCode === 0) condition = 'clear'
            else if (weatherCode === 1 || weatherCode === 2) condition = 'clouds'
            else if (weatherCode === 3) condition = 'clouds'
            else if (weatherCode >= 45 && weatherCode <= 48) condition = 'drizzle'
            else if (weatherCode >= 51 && weatherCode <= 67) condition = 'drizzle'
            else if (weatherCode >= 71 && weatherCode <= 85) condition = 'rain'
            else if (weatherCode >= 80 && weatherCode <= 82) condition = 'rain'
            else if (weatherCode >= 85 && weatherCode <= 99) condition = 'thunderstorm'
            
            setWeather({
              temp: Math.round(current.temperature_2m),
              condition: condition,
              humidity: current.relative_humidity_2m,
              windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
              location: locationName,
              icon: condition,
            })
            setLoading(false)
          },
          (err) => {
            console.error('Geolocation error:', err)
            setError('Unable to get location')
            setLoading(false)
          }
        )
      } catch (err) {
        console.error('Weather error:', err)
        setError('Unable to fetch weather')
        setLoading(false)
      }
    }

    fetchWeather()
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
        <div className="h-5 w-5 bg-muted-foreground/20 rounded-full animate-pulse" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (error || !weather) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-help">
            {weatherIcons[weather.icon] || weatherIcons['clear']}
            <span className="text-sm font-medium text-foreground">{weather.temp}°C</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-card border border-border text-card-foreground">
          <div className="space-y-2 p-2">
            <p className="font-semibold">{weather.location}</p>
            <p className="text-sm capitalize">{weather.condition}</p>
            <div className="flex items-center gap-2 text-sm">
              <Droplets className="h-4 w-4" />
              Humidity: {weather.humidity}%
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wind className="h-4 w-4" />
              Wind: {weather.windSpeed} km/h
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
