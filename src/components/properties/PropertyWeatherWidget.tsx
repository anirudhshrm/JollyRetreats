import { useEffect, useState } from 'react'
import { Cloud, CloudRain, Sun, Wind, Droplets, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface PropertyWeatherProps {
  location: string
  latitude: number
  longitude: number
}

interface WeatherData {
  temp: number
  condition: string
  humidity: number
  windSpeed: number
  feelsLike: number
  icon: string
}

const weatherIcons: Record<string, { component: React.FC<{ className?: string }>, color: string }> = {
  'clear': { component: Sun, color: 'text-yellow-500' },
  'clouds': { component: Cloud, color: 'text-gray-400' },
  'rain': { component: CloudRain, color: 'text-blue-400' },
  'drizzle': { component: CloudRain, color: 'text-blue-300' },
  'thunderstorm': { component: CloudRain, color: 'text-blue-600' },
}

export function PropertyWeatherWidget({ location, latitude, longitude }: PropertyWeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch weather data from Open-Meteo API
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature&timezone=auto`
        )

        if (!response.ok) throw new Error('Weather fetch failed')

        const data = await response.json()
        const current = data.current

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
          feelsLike: Math.round(current.apparent_temperature),
          icon: condition,
        })
      } catch (err) {
        console.error('Weather error:', err)
        setError('Unable to fetch weather')
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [latitude, longitude])

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading weather...</p>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">{error || 'Weather data unavailable'}</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground mb-4 text-sm sm:text-base">Weather at {location}</h3>
      
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center flex-shrink-0">
            {(() => {
              const iconData = weatherIcons[weather.icon] || weatherIcons['clear']
              const IconComponent = iconData.component
              return <IconComponent className={`h-6 w-6 ${iconData.color}`} />
            })()}
          </div>
          
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl font-bold text-foreground">
                {weather.temp}°C
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Feels {weather.feelsLike}°C
            </p>
            <p className="text-xs capitalize text-muted-foreground">
              {weather.condition}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 2xl:grid-cols-2">
        <div className="flex min-w-0 items-center gap-3 rounded-lg bg-muted/50 p-3">
          <Droplets className="h-5 w-5 flex-shrink-0 text-blue-500" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Humidity</p>
            <p className="whitespace-nowrap text-base font-semibold text-foreground">{weather.humidity}%</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3 rounded-lg bg-muted/50 p-3">
          <Wind className="h-5 w-5 flex-shrink-0 text-cyan-500" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Wind</p>
            <p className="whitespace-nowrap text-base font-semibold text-foreground">{weather.windSpeed} km/h</p>
          </div>
        </div>
      </div>
    </div>
  )
}
