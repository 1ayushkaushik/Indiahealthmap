"use client"

import { useFilterStore } from "@/lib/store"
import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import { format, parseISO } from "date-fns"

interface ChartData {
  date: string
  cases: number
  deaths: number
  temperature?: number
  rainfall?: number
}

export function DiseaseCharts() {
  const { disease, view, timeRange, selectedRegion } = useFilterStore()
  const [data, setData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const params = new URLSearchParams({
      disease: encodeURIComponent(disease),
      view,
      start: timeRange.start,
      end: timeRange.end,
      groupBy: 'date'
    })

    // Add region parameters if a region is selected
    if (selectedRegion) {
      if (view === 'state') {
        params.append('stateName', selectedRegion)
      } else {
        const [stateName, districtName] = selectedRegion.split('|')
        params.append('stateName', stateName)
        params.append('districtName', districtName)
      }
    }

    fetch(`/api/disease-trends?${params}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch trend data: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        if (!Array.isArray(data)) {
          console.error('Invalid data format:', data)
          setData([])
          return
        }

        // Process and validate each data point
        const validData = data
          .filter(item => {
            const isValid = 
              typeof item === 'object' &&
              item !== null &&
              typeof item.date === 'string' &&
              !isNaN(new Date(item.date).getTime()) && // Ensure valid date
              typeof item.cases === 'number' &&
              typeof item.deaths === 'number'

            if (!isValid) {
              console.error('Invalid data item:', item)
            }
            return isValid
          })
          .map(item => ({
            date: item.date,
            cases: item.cases || 0,
            deaths: item.deaths || 0,
            ...generateWeatherData(item.date)
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by date

        console.log('Processed chart data:', validData) // Debug log
        setData(validData)
      })
      .catch(error => {
        console.error('Error fetching trend data:', error)
        setData([])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [disease, view, timeRange, selectedRegion])

  // Move generateWeatherData inside useEffect to avoid dependency issues
  const generateWeatherData = useCallback((date: string) => {
    const seededRandom = (seed: string) => {
      const numericSeed = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const x = Math.sin(numericSeed) * 10000
      return x - Math.floor(x)
    }

    const random1 = seededRandom(date + 'temp')
    const random2 = seededRandom(date + 'rain')
    
    return {
      temperature: Math.round(random1 * 25 + 15), // 15-40°C
      rainfall: Math.round(random2 * 100) // 0-100mm
    }
  }, [])

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d')
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid date'
    }
  }

  const formatTooltipDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'PPP')
    } catch (error) {
      console.error('Error formatting tooltip date:', dateString, error)
      return 'Invalid date'
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 200)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToMap = () => {
    const mapElement = document.querySelector('.map-container')
    if (mapElement) {
      mapElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  // Get the region name for display
  const getRegionName = () => {
    if (!selectedRegion) return 'All Regions'
    if (view === 'state') return selectedRegion
    const [stateName, districtName] = selectedRegion.split('|')
    return `${districtName}, ${stateName}`
  }

  return (
    <Card className="p-6 chart-container relative">
      <div className="mb-4 flex flex-col justify-between items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={scrollToMap}
        >
          <ArrowUp className="h-4 w-4" />
          <span>View Map</span>
        </Button>
        <div className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {getRegionName()}
          </p>
        </div>
      </div>      
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
            />
            <YAxis yAxisId="left" />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              domain={[0, 100]}
              label={{ value: 'Temperature (°C) / Rainfall (mm)', angle: 90, position: 'right' }}
            />
            <Tooltip
              labelFormatter={formatTooltipDate}
              formatter={(value: number, name: string) => {
                switch(name) {
                  case 'Temperature':
                    return [`${value}°C`, name]
                  case 'Rainfall':
                    return [`${value}mm`, name]
                  default:
                    return [value.toLocaleString(), name]
                }
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="cases" 
              stroke="#0ea5e9" 
              name="Cases"
              strokeWidth={2}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="deaths" 
              stroke="#ef4444" 
              name="Deaths"
              strokeWidth={2}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="temperature" 
              stroke="#eab308" 
              name="Temperature"
              strokeWidth={2}
              dot={false}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="rainfall" 
              stroke="#3b82f6" 
              name="Rainfall"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
} 