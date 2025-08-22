"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { PlusIcon, Trash2Icon, DownloadIcon } from "lucide-react"
import { ComparisonMap } from "@/components/maps/comparison-map"
import { generateComparisonImage } from "@/lib/utils/export/comparison"
import { ColorScheme } from "@/lib/constants/color-schemes"

interface Disease {
  id: number
  name: string
  totalCases: number
  totalDeaths: number
}

interface MapConfig {
  id: string
  disease: string
  metric: 'cases' | 'deaths'
  view: 'district' | 'state'
  colorScheme: ColorScheme
  timeRange: { start: string; end: string }
}

interface ComparisonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ComparisonDialog({ open, onOpenChange }: ComparisonDialogProps) {
  const [diseases, setDiseases] = useState<Disease[]>([])
  const [maps, setMaps] = useState<MapConfig[]>([
    { 
      id: '1', 
      disease: '', 
      metric: 'cases',
      view: 'state',
      colorScheme: 'teal',
      timeRange: { start: '', end: '' }
    },
    { 
      id: '2', 
      disease: '', 
      metric: 'cases',
      view: 'state',
      colorScheme: 'teal',
      timeRange: { start: '', end: '' }
    }
  ])
  const [isExporting, setIsExporting] = useState(false)
  
  useEffect(() => {
    fetch('/api/diseases')
      .then(res => res.json())
      .then(data => setDiseases(data))
      .catch(error => console.error('Error fetching diseases:', error))
  }, [])
  
  const addMap = () => {
    if (maps.length >= 6) return
    
    setMaps([
      ...maps, 
      { 
        id: Date.now().toString(), 
        disease: '', 
        metric: 'cases',
        view: 'state',
        colorScheme: 'teal',
        timeRange: { start: '', end: '' }
      }
    ])
  }
  
  const removeMap = (id: string) => {
    if (maps.length <= 2) return
    setMaps(maps.filter(map => map.id !== id))
  }
  
  const updateMap = (id: string, updates: Partial<MapConfig>) => {
    setMaps(maps.map(map => 
      map.id === id ? { ...map, ...updates } : map
    ))
  }
  
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const firstMap = maps[0];
      await generateComparisonImage(maps, firstMap.view, firstMap.colorScheme)
    } finally {
      setIsExporting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Disease Maps</DialogTitle>
          <DialogDescription>
            Compare up to 6 different disease maps side by side.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className={`grid gap-4 ${maps.length <= 3 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
            {maps.map((map, index) => (
              <div key={map.id} className="border rounded-md p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Map {index + 1}</h3>
                  {maps.length > 2 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeMap(map.id)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div>
                  <Label htmlFor={`disease-${map.id}`} className="text-sm">Disease</Label>
                  <Select 
                    value={map.disease} 
                    onValueChange={(value) => updateMap(map.id, { disease: value })}
                  >
                    <SelectTrigger id={`disease-${map.id}`} className="w-full bg-white dark:bg-slate-800 mt-1">
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
                  <Label className="text-sm">Metric</Label>
                  <RadioGroup 
                    value={map.metric} 
                    onValueChange={(value) => updateMap(map.id, { metric: value as 'cases' | 'deaths' })}
                    className="flex gap-4 mt-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cases" id={`cases-${map.id}`} />
                      <Label htmlFor={`cases-${map.id}`} className="font-normal">Cases</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="deaths" id={`deaths-${map.id}`} />
                      <Label htmlFor={`deaths-${map.id}`} className="font-normal">Deaths</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="h-[200px] bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                  {map.disease ? (
                    <ComparisonMap
                      id={map.id}
                      disease={map.disease}
                      metric={map.metric}
                      view={map.view}
                      colorScheme={map.colorScheme}
                      timeRange={map.timeRange}
                      height={200}
                      totalMaps={maps.length}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      Select a disease to preview
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {maps.length < 6 && (
              <div className="border border-dashed rounded-md p-4 flex items-center justify-center">
                <Button 
                  variant="outline" 
                  onClick={addMap}
                  className="h-20 w-full"
                >
                  <PlusIcon className="h-6 w-6 mr-2" />
                  Add Map
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleExport}
              disabled={isExporting || maps.some(m => !m.disease)}
              className="gap-2"
            >
              <DownloadIcon className="h-4 w-4" />
              {isExporting ? 'Generating...' : 'Export Comparison'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

