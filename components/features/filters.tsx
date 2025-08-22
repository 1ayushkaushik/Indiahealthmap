"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, ImageDown, FileImage } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useFilterStore, type TimeRangeType } from "@/lib/store"
import { useState, useEffect } from "react"
import { exportReport } from "@/lib/utils/export-report"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { ComparisonDialog } from "@/components/features/comparison-dialog"
import { ExportSettingsDialog } from "@/components/features/export-settings-dialog"
import { COLOR_SCHEMES, type ColorScheme } from "@/lib/constants/color-schemes"
import { APIError } from "@/lib/api/errors"
import { exportMap } from '@/lib/utils/export'

interface Disease {
  id: number
  name: string
  totalCases: number
  totalDeaths: number
}

export function Filters() {
  const { 
    view, setView, 
    disease, setDisease, 
    metric, setMetric,
    colorScheme, setColorScheme,
    timeRangeType, setTimeRangeType,
    timeRange, setTimeRange,
    showLabels, setShowLabels,
  } = useFilterStore()
  const [diseases, setDiseases] = useState<Disease[]>([])
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const res = await fetch('/api/diseases')
        if (!res.ok) {
          throw new Error(`Failed to fetch diseases: ${res.status}`)
        }
        const data = await res.json()
        
        // Validate the data
        if (!Array.isArray(data)) {
          console.error('Invalid diseases data:', data)
          setDiseases([])
          return
        }

        // Validate each disease object
        const validDiseases = data.filter((d): d is Disease => {
          const isValid = 
            typeof d === 'object' &&
            d !== null &&
            typeof d.id === 'number' &&
            typeof d.name === 'string' &&
            typeof d.totalCases === 'number' &&
            typeof d.totalDeaths === 'number'
          
          if (!isValid) {
            console.error('Invalid disease object:', d)
          }
          return isValid
        })

        setDiseases(validDiseases)
      } catch (error) {
        console.error('Error fetching diseases:', error)
        setDiseases([])
      }
    }

    fetchDiseases()
  }, [])

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PP')
    } catch {
      return 'Invalid date'
    }
  }

  return (
    <Card className="p-6 h-[700px] space-y-6">
      <div>
        <Label className="text-sm font-semibold">View Level</Label>
        <RadioGroup 
          value={view} 
          onValueChange={(value) => setView(value as 'district' | 'state')}
          className="flex gap-4 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="state" id="state" />
            <Label htmlFor="state" className="font-normal">State</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="district" id="district" />
            <Label htmlFor="district" className="font-normal">District</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label className="text-sm font-semibold">Metric</Label>
        <RadioGroup 
          value={metric} 
          onValueChange={(value) => setMetric(value as 'cases' | 'deaths')}
          className="flex gap-4 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cases" id="cases" />
            <Label htmlFor="cases" className="font-normal">Cases</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="deaths" id="deaths" />
            <Label htmlFor="deaths" className="font-normal">Deaths</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="disease" className="text-sm font-semibold">Disease</Label>
        <Select value={disease} onValueChange={setDisease}>
          <SelectTrigger id="disease" className="w-full bg-white dark:bg-slate-800">
            <SelectValue placeholder="Select disease" />
          </SelectTrigger>
          <SelectContent>
            {diseases.map(d => (
              <SelectItem key={d.id} value={d.name}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="color-scheme" className="text-sm font-semibold">Color Scheme</Label>
        <Select value={colorScheme} onValueChange={(value) => setColorScheme(value as 'teal' | 'blue' | 'red')}>
          <SelectTrigger id="color-scheme" className="w-full bg-white dark:bg-slate-800">
            <SelectValue placeholder="Select color scheme" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(COLOR_SCHEMES).map((scheme) => (
              <SelectItem key={scheme} value={scheme}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-sm" 
                    style={{ backgroundColor: COLOR_SCHEMES[scheme as ColorScheme][0] }}
                  />
                  <span className="capitalize">{scheme}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Time Range</Label>
        <RadioGroup 
          value={timeRangeType} 
          onValueChange={(value) => setTimeRangeType(value as TimeRangeType)}
          className="flex flex-col gap-2 mb-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="total" id="total" />
            <Label htmlFor="total" className="font-normal">All Time</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yearly" id="yearly" />
            <Label htmlFor="yearly" className="font-normal">Last 12 Months</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="specific" id="specific" />
            <Label htmlFor="specific" className="font-normal">Custom Range</Label>
          </div>
        </RadioGroup>

        {timeRangeType === 'specific' && (
          <div className="flex flex-col gap-2 mt-2 pl-6">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-slate-800">
                  <span>{formatDate(timeRange.start)}</span>
                  <CalendarIcon className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={new Date(timeRange.start)}
                  onSelect={(date) => date && setTimeRange({
                    ...timeRange,
                    start: date.toISOString()
                  })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-slate-800">
                  <span>{formatDate(timeRange.end)}</span>
                  <CalendarIcon className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={new Date(timeRange.end)}
                  onSelect={(date) => date && setTimeRange({
                    ...timeRange,
                    end: date.toISOString()
                  })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {view === 'state' && (
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="show-labels" className="text-sm font-semibold">
              Show Labels
            </Label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Display state names and values on map
            </p>
          </div>
          <Switch
            id="show-labels"
            checked={showLabels}
            onCheckedChange={setShowLabels}
          />
        </div>
      )}

      <div className="mt-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowExportDialog(true)}
        >
          <span>Export Data</span>
        </Button>
      </div>

      {isMounted && (
        <ExportSettingsDialog 
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          mapData={{
            disease,
            metric,
            view,
            colorScheme,
            timeRange,
            showLabels
          }}
        />
      )}
    </Card>
  )
}

