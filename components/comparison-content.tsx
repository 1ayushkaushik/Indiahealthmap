"use client"

import { useState, useEffect } from 'react';
import { COLOR_SCHEMES, type ColorScheme } from '@/lib/constants/color-schemes';
import { Loading } from '@/components/shared/loading';
import dynamic from 'next/dynamic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2Icon, PlusIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { type MetricType, type ViewType } from '@/lib/store';
import { ExportButton } from '@/components/features/export-button';

// Correctly import the ComparisonMap component
const ComparisonMap = dynamic(
  () => import('@/components/maps/comparison-map'),
  { 
    ssr: false,
    loading: () => <Loading height={200} />
  }
);

interface ComparisonMapState {
  id: string;
  disease: string;
  metric: MetricType;
  view: ViewType;
  colorScheme: ColorScheme;
  timeRange: {
    start: string;
    end: string;
  };
  showLabels: boolean;
}

export default function ComparisonContent() {
  const [diseases, setDiseases] = useState<Array<{ id: number; name: string }>>([]);
  const [expandedMap, setExpandedMap] = useState<string | null>(null);
  const [maps, setMaps] = useState<ComparisonMapState[]>([
    {
      id: '1',
      disease: 'acute diarrheal disease',
      metric: 'cases',
      view: 'state',
      colorScheme: 'teal',
      showLabels: false,
      timeRange: {
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-12-31T23:59:59.999Z'
      }
    },
    {
      id: '2',
      disease: 'chickenpox',
      metric: 'cases',
      view: 'state',
      colorScheme: 'teal',
      showLabels: false,
      timeRange: {
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-12-31T23:59:59.999Z'
      }
    }
  ]);
  const [collapsedMaps, setCollapsedMaps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Fetch available diseases
    fetch('/api/diseases')
      .then(res => res.json())
      .then(data => setDiseases(data))
      .catch(error => console.error('Error fetching diseases:', error));
  }, []);

  const updateMap = (id: string, updates: Partial<ComparisonMapState>) => {
    setMaps(maps.map(map => 
      map.id === id ? { ...map, ...updates } : map
    ));
  };

  const addMap = () => {
    if (maps.length >= 4) return;
    const newId = String(maps.length + 1);
    setMaps([...maps, {
      id: newId,
      disease: 'acute diarrheal disease',
      metric: 'cases',
      view: maps[0].view,
      colorScheme: 'teal',
      showLabels: false,
      timeRange: {
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-12-31T23:59:59.999Z'
      }
    }]);
    setExpandedMap(newId);
  };

  const removeMap = (id: string) => {
    if (maps.length <= 2) return;
    setMaps(maps.filter(map => map.id !== id));
    if (expandedMap === id) {
      setExpandedMap(null);
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedMaps(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[400px,1fr] gap-6 min-h-[calc(100vh-8rem)]">
      {/* Scrollable Settings Panel */}
      <div className="overflow-auto pr-2 space-y-6">
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-4 sticky top-0 bg-white dark:bg-slate-800 py-2">
            Map Settings
          </h2>
          
          {maps.map((map, index) => (
            <div key={map.id} className="mb-4">
              <div 
                className="p-4 border rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                onClick={() => toggleCollapse(map.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Map {index + 1}</h3>
                    <span className="text-sm text-slate-500 hidden sm:inline">
                      {map.disease || 'No disease selected'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {maps.length > 2 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeMap(map.id)
                        }}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    )}
                    {collapsedMaps[map.id] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible content */}
              {!collapsedMaps[map.id] && (
                <div className="mt-2 p-4 border-l border-r border-b rounded-b-md">
                  <div className="space-y-4">
                    <div>
                      <Label>Disease</Label>
                      <Select 
                        value={map.disease} 
                        onValueChange={(value) => updateMap(map.id, { disease: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select disease" />
                        </SelectTrigger>
                        <SelectContent>
                          {diseases.map(disease => (
                            <SelectItem key={`${disease.id}-${disease.name}`} value={disease.name}>
                              {disease.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Metric</Label>
                      <RadioGroup 
                        value={map.metric}
                        onValueChange={(value) => updateMap(map.id, { metric: value as 'cases' | 'deaths' })}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cases" id={`cases-${map.id}`} />
                          <Label htmlFor={`cases-${map.id}`}>Cases</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="deaths" id={`deaths-${map.id}`} />
                          <Label htmlFor={`deaths-${map.id}`}>Deaths</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label>Color Scheme</Label>
                      <Select 
                        value={map.colorScheme}
                        onValueChange={(value) => updateMap(map.id, { colorScheme: value as ColorScheme })}
                      >
                        <SelectTrigger>
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
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="sticky bottom-0 bg-white dark:bg-slate-800 pt-4 space-y-4">
            {maps.length < 6 && (
              <Button 
                variant="outline" 
                onClick={addMap}
                className="w-full"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Map
              </Button>
            )}

            <div className="grid grid-cols-1 gap-4 mt-6">
              <ExportButton 
                type="comparison"
                data={{
                  maps: maps.map(map => ({
                    disease: map.disease,
                    metric: map.metric,
                    view: map.view,
                    colorScheme: map.colorScheme,
                    timeRange: map.timeRange,
                    showLabels: map.showLabels
                  })).filter(map => map.disease)
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Maps Visualization */}
      <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-fr bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {maps.map((map, index) => (
          <div 
            key={map.id} 
            className={`
              relative
              ${index % 2 === 0 ? 'sm:border-r border-slate-200 dark:border-slate-700' : ''}
              ${index < maps.length - 2 ? 'border-b border-slate-200 dark:border-slate-700' : ''}
            `}
          >
            {map.disease ? (
              <ComparisonMap
                id={map.id}
                disease={map.disease}
                metric={map.metric}
                view={map.view || 'state'}
                colorScheme={map.colorScheme || 'teal'}
                timeRange={map.timeRange}
                height={400}
                totalMaps={maps.length}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                Configure map settings to preview
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 