"use client"

import { useState, useRef } from 'react'
import { Upload, FileText, Table } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Input from '@/components/ui/input'
import { parseCSV } from '@/lib/utils/csv'
import UI_Layout from '@/components/layout/ui-layout'
import dynamic from 'next/dynamic'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { COLOR_SCHEMES, type ColorScheme } from "@/lib/constants/color-schemes"
import { ExportButton } from '@/components/features/export-button'

const MapWrapper = dynamic(
  () => import('@/components/maps/map-wrapper').then(mod => mod.default),
  { ssr: false }
)

interface UploadedData {
  headers: string[];
  rows: string[][];
}

interface ValidationError {
  type: 'format' | 'missing' | 'invalid';
  message: string;
}

export default function UploadPage() {
  const [uploadedData, setUploadedData] = useState<{ headers: string[]; rows: string[][]; } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('teal');
  const [pastedText, setPastedText] = useState('');
  const [topDistricts, setTopDistricts] = useState<Array<{ name: string; value: number }>>([]);
  const [values, setValues] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const text = await file.text()
      const parsedData = parseCSV(text)
      setUploadedData(parsedData)
      setTopDistricts(calculateTopDistricts(parsedData))
    } catch (err) {
      setError('Failed to parse file. Please ensure it\'s a valid CSV/TSV file.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const validateData = (data: UploadedData): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Check for required columns
    const hasState = data.headers.some(h => h.toLowerCase().includes('state'));
    const hasCases = data.headers.some(h => h.toLowerCase().includes('case'));
    const hasDeaths = data.headers.some(h => h.toLowerCase().includes('death'));

    if (!hasState) {
      errors.push({ type: 'missing', message: 'Missing state column in headers' });
    }
    if (!hasCases && !hasDeaths) {
      errors.push({ type: 'missing', message: 'Missing both cases and deaths columns' });
    }

    // Check each row
    data.rows.forEach((row, index) => {
      if (row.length !== data.headers.length) {
        errors.push({ 
          type: 'format', 
          message: `Row ${index + 1} has incorrect number of columns` 
        });
      }
      
      // Check for empty or invalid values
      row.forEach((cell, cellIndex) => {
        const header = data.headers[cellIndex].toLowerCase();
        if (!cell.trim()) {
          errors.push({ 
            type: 'invalid', 
            message: `Empty value in row ${index + 1}, column "${data.headers[cellIndex]}"` 
          });
        }
        if ((header.includes('case') || header.includes('death')) && isNaN(Number(cell))) {
          errors.push({ 
            type: 'invalid', 
            message: `Invalid number in row ${index + 1}, column "${data.headers[cellIndex]}"` 
          });
        }
      });
    });

    return errors;
  };

  const handlePastedData = (text: string) => {
    setPastedText(text);
    setError(null);
  };

  const handleSubmit = () => {
    if (!pastedText.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const parsedData = parseCSV(pastedText);
      const validationErrors = validateData(parsedData);
      
      if (validationErrors.length > 0) {
        setError(validationErrors[0].message);
        setUploadedData(null);
        setTopDistricts([]);
        setValues({});
      } else {
        // Process data for visualization
        const processedValues: { [key: string]: number } = {};
        
        // Find the indices of important columns
        const stateIndex = parsedData.headers.findIndex(h => 
          h.toLowerCase().includes('state') || h.toLowerCase().includes('district')
        );
        const valueIndex = parsedData.headers.findIndex(h => 
          h.toLowerCase().includes('case') || h.toLowerCase().includes('death')
        );
        
        // Use the first column as location if state/district not found
        const locationIndex = stateIndex !== -1 ? stateIndex : 0;
        // Use the second column as value if cases/deaths not found
        const dataIndex = valueIndex !== -1 ? valueIndex : 1;
        
        // Process each row
        parsedData.rows.forEach(row => {
          if (row.length > dataIndex) {
            const name = row[locationIndex];
            const valueStr = row[dataIndex];
            const value = parseFloat(valueStr);
            
            if (name && !isNaN(value)) {
              processedValues[name] = (processedValues[name] || 0) + value;
            }
          }
        });
        
        setValues(processedValues);
        setUploadedData(parsedData);
        setTopDistricts(calculateTopDistricts(parsedData));
      }
    } catch (err) {
      console.error('Parse error:', err);
      setError('Failed to parse data. Please ensure it\'s valid CSV/TSV format.');
      setUploadedData(null);
      setTopDistricts([]);
      setValues({});
    } finally {
      setLoading(false);
    }
  };

  const calculateTopDistricts = (data: UploadedData) => {
    const stateIndex = data.headers.findIndex(h => h.toLowerCase().includes('state'));
    const casesIndex = data.headers.findIndex(h => h.toLowerCase().includes('case'));
    const deathsIndex = data.headers.findIndex(h => h.toLowerCase().includes('death'));

    const valueIndex = casesIndex !== -1 ? casesIndex : deathsIndex;
    if (stateIndex === -1 || valueIndex === -1) return [];

    const districtMap = new Map<string, number>();
    data.rows.forEach(row => {
      const district = row[stateIndex];
      const value = Number(row[valueIndex]) || 0;
      districtMap.set(district, (districtMap.get(district) || 0) + value);
    });

    return Array.from(districtMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const processData = (data: UploadedData) => {
    const processedValues: { [key: string]: number } = {};
    const districts: Array<{ name: string; value: number }> = [];

    data.rows.forEach(row => {
      const name = row[0];
      const value = parseFloat(row[1]);
      if (!isNaN(value)) {
        processedValues[name] = value;
        districts.push({ name, value });
      }
    });

    // Sort districts by value in descending order and take top 10
    const sortedDistricts = districts.sort((a, b) => b.value - a.value).slice(0, 10);

    setValues(processedValues);
    setTopDistricts(sortedDistricts);
    setUploadedData(data);
  };

  return (
    <UI_Layout>
      <div className="container mx-auto py-4 md:py-8 space-y-4 md:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Upload Disease Data</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="colorScheme" className="text-sm whitespace-nowrap">Color Scheme:</label>
              <Select value={colorScheme} onValueChange={(value) => setColorScheme(value as ColorScheme)}>
                <SelectTrigger id="color-scheme">
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
            {uploadedData && (
              <ExportButton
                type="upload"
                data={{
                  uploadedData,
                  colorScheme
                }}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Map container - full width on mobile */}
          <div className="h-[400px] md:h-[500px] lg:h-[700px] w-full lg:w-2/3 bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
            <MapWrapper 
              type="upload" 
              data={{
                uploadedData: uploadedData || undefined,
                colorScheme
              }}
            />
          </div>

          {/* Form container - full width on mobile */}
          <div className="space-y-4 w-full lg:w-1/3">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 md:p-6 shadow-sm">
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="file" className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    File Upload
                  </TabsTrigger>
                  <TabsTrigger value="paste" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Paste Data
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file">
                  <div className="space-y-2">
                    <Label htmlFor="data-file">Upload CSV/TSV File</Label>
                    <Input 
                      id="data-file"
                      type="file"
                      accept=".csv,.tsv,text/csv,text/tab-separated-values"
                      onChange={handleFileUpload}
                      disabled={loading}
                    />
                    <p className="text-sm text-slate-500">
                      Accepted formats: CSV, TSV
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="paste">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="data-paste">Paste CSV/TSV Data</Label>
                      <Textarea 
                        id="data-paste"
                        placeholder="State,Cases,Deaths&#10;Maharashtra,100,10&#10;Kerala,50,5"
                        className="min-h-[200px] font-mono"
                        onChange={(e) => handlePastedData(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="flex space-x-4">
                      <Button 
                        onClick={handleSubmit} 
                        disabled={!pastedText.trim() || loading}
                        className="flex-1"
                      >
                        {loading ? 'Processing...' : 'Visualize Data'}
                      </Button>
                      
                      <ExportButton 
                        type="upload"
                        data={{
                          uploadedData,
                          colorScheme
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
                {error}
              </div>
            )}

            {uploadedData && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 md:p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Data Preview</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead>
                      <tr>
                        {uploadedData.headers.map((header, i) => (
                          <th key={i} className="px-3 py-2 text-left text-sm font-semibold">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {uploadedData.rows.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-sm whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {uploadedData.rows.length > 5 && (
                    <p className="mt-2 text-sm text-slate-500">
                      Showing first 5 of {uploadedData.rows.length} rows
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </UI_Layout>
  )
} 