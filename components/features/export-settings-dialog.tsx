"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Input from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { exportMap } from '@/lib/utils/export'
import { ColorScheme } from '@/lib/constants/color-schemes'

export interface ExportSettings {
  title: string
  description: string
  showLegend: boolean
  showTop5: boolean
  showLabels: boolean
  includeCredits: boolean
  exportType: 'png' | 'svg'
}

interface ExportSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mapData: {
    disease: string
    metric: 'cases' | 'deaths'
    view: 'district' | 'state'
    colorScheme: ColorScheme
    timeRange: { start: string; end: string }
    showLabels: boolean
  }
}

export function ExportSettingsDialog({ open, onOpenChange, mapData }: ExportSettingsDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [settings, setSettings] = useState<ExportSettings>({
    title: '',
    description: '',
    showLegend: true,
    showTop5: true,
    showLabels: mapData.showLabels,
    includeCredits: true,
    exportType: 'png'
  })

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      await exportMap({
        ...mapData,
        title: settings.title,
        description: settings.description,
        showLabels: settings.showLabels,
        includeCredits: settings.includeCredits,
        showLegend: settings.showLegend,
        showTop5: settings.showTop5,
        exportType: settings.exportType
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error exporting map:', error)
      let errorMessage = 'Failed to export map';
      
      if (error instanceof Error) {
        // If we have a specific error message, use it
        errorMessage = error.message;
      }
      
      // Show error in a way that doesn't block the UI
      alert(`Export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Settings</DialogTitle>
          <DialogDescription>
            Customize your export options
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title (Optional)
            </Label>
            <Input
              id="title"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              className="col-span-3"
              placeholder="Leave blank to hide title"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description (Optional)
            </Label>
            <Input
              id="description"
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              className="col-span-3"
              placeholder="Leave blank to hide description"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Export Format
            </Label>
            <Tabs 
              defaultValue="png" 
              value={settings.exportType}
              onValueChange={(value) => setSettings({ ...settings, exportType: value as 'png' | 'svg' })}
              className="col-span-3"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="png">PNG</TabsTrigger>
                <TabsTrigger value="svg">SVG</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-right">
              <Label>Show Legend</Label>
            </div>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch
                id="show-legend"
                checked={settings.showLegend}
                onCheckedChange={(checked) => setSettings({ ...settings, showLegend: checked })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-right">
              <Label>Show Top 5</Label>
            </div>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch
                id="show-top5"
                checked={settings.showTop5}
                onCheckedChange={(checked) => setSettings({ ...settings, showTop5: checked })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-right">
              <Label>Show Labels</Label>
            </div>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch
                id="show-labels"
                checked={settings.showLabels}
                onCheckedChange={(checked) => setSettings({ ...settings, showLabels: checked })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-right">
              <Label>Include Credits</Label>
            </div>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch
                id="include-credits"
                checked={settings.includeCredits}
                onCheckedChange={(checked) => setSettings({ ...settings, includeCredits: checked })}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Exporting...</span>
              </div>
            ) : (
              <span>Export</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 