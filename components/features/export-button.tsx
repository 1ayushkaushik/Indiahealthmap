"use client"

import * as React from "react"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DialogPortal,
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Label } from '@/components/ui/label'
import Input from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { exportMap, exportComparisonMap, exportUploadMap } from '@/lib/utils/export'
import { ColorScheme } from '@/lib/constants/color-schemes'

// Custom Dialog without overlay
const Dialog = DialogPrimitive.Root;

// Custom DialogContent without overlay
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[1000] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName;

interface ExportButtonProps {
  type: 'disease' | 'comparison' | 'upload';
  data: {
    disease?: string;
    metric?: 'cases' | 'deaths';
    view?: 'district' | 'state';
    colorScheme?: ColorScheme;
    timeRange?: { start: string; end: string };
    showLabels?: boolean;
    maps?: any[];
    uploadedData?: any;
  };
}

export function ExportButton({ type, data }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    title: '',
    description: '',
    showLabels: false,
    showLegend: true,
    includeCredits: true,
    exportType: 'png' as 'png' | 'svg'
  });

  // Fix hydration mismatch by only rendering the final state after mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Set initial title based on data
  useEffect(() => {
    if (type === 'disease' && data.disease) {
      setExportSettings(prev => ({
        ...prev,
        title: `${data.disease} ${data.metric} by ${data.view}`,
        description: `Data visualization for ${data.disease} ${data.metric === 'cases' ? 'cases' : 'deaths'} at ${data.view} level`
      }));
    } else if (type === 'upload') {
      setExportSettings(prev => ({
        ...prev,
        title: 'Custom Data Map',
        description: 'Visualization of uploaded data'
      }));
    }
  }, [type, data]);

  const handleExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      switch (type) {
        case 'disease': {
          if (!data.disease || !data.metric || !data.view || !data.timeRange) {
            throw new Error('Missing required data for disease export');
          }
          
          await exportMap({
            disease: data.disease,
            metric: data.metric,
            view: data.view,
            colorScheme: data.colorScheme || 'teal',
            timeRange: data.timeRange,
            showLabels: data.showLabels || false,
            title: exportSettings.title,
            description: exportSettings.description,
            includeCredits: exportSettings.includeCredits,
            showLegend: exportSettings.showLegend,
            exportType: exportSettings.exportType
          });
          break;
        }
        
        case 'comparison': {
          if (!data.maps || !Array.isArray(data.maps) || data.maps.length === 0) {
            throw new Error('Missing maps data for comparison export');
          }
          
          await exportComparisonMap(
            data.maps,
            {
              simplifiedView: true,
              exportType: exportSettings.exportType
            }
          );
          break;
        }
        
        case 'upload': {
          if (!data.uploadedData) {
            throw new Error('Missing upload data for export');
          }
          
          await exportUploadMap(
            data.uploadedData, 
            data.colorScheme || 'teal',
            {
              title: exportSettings.title,
              description: exportSettings.description,
              showLabels: exportSettings.showLabels,
              showLegend: exportSettings.showLegend,
              includeCredits: exportSettings.includeCredits,
              exportType: exportSettings.exportType
            }
          );
          break;
        }
      }
      setShowExportDialog(false);
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
      alert(error instanceof Error ? error.message : `Failed to export ${type}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Don't render anything during server-side rendering to avoid hydration mismatch
  if (!isMounted) {
    return <Button variant="outline" className="w-full">Export Map</Button>;
  }

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setShowExportDialog(true)}
        className="w-full"
      >
        Export Map
      </Button>

      {isMounted && (
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="sm:max-w-md border-2 border-primary/20 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Export Settings</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={exportSettings.title}
                  onChange={(e) => setExportSettings({...exportSettings, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={exportSettings.description}
                  onChange={(e) => setExportSettings({...exportSettings, description: e.target.value})}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Tabs 
                  value={exportSettings.exportType} 
                  onValueChange={(value) => setExportSettings({...exportSettings, exportType: value as 'png' | 'svg'})}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="png">PNG</TabsTrigger>
                    <TabsTrigger value="svg">SVG</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showLabels"
                    checked={exportSettings.showLabels}
                    onCheckedChange={(checked) => setExportSettings({...exportSettings, showLabels: checked})}
                  />
                  <Label htmlFor="showLabels">Show Labels</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showLegend"
                    checked={exportSettings.showLegend}
                    onCheckedChange={(checked) => setExportSettings({...exportSettings, showLegend: checked})}
                  />
                  <Label htmlFor="showLegend">Show Legend</Label>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeCredits"
                  checked={exportSettings.includeCredits}
                  onCheckedChange={(checked) => setExportSettings({...exportSettings, includeCredits: checked})}
                />
                <Label htmlFor="includeCredits">Include Credits</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
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
      )}
    </>
  );
} 