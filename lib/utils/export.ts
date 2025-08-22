import { saveAs } from 'file-saver';
import { API_ENDPOINTS } from '@/lib/constants/api';
import { ColorScheme } from '@/lib/constants/color-schemes';

interface ExportMapOptions {
  disease: string;
  metric: 'cases' | 'deaths';
  view: 'district' | 'state';
  colorScheme: ColorScheme;
  timeRange: { start: string; end: string };
  showLabels: boolean;
  title?: string;
  description?: string;
  includeCredits?: boolean;
  showLegend?: boolean;
  showTop5?: boolean;
  exportType?: 'png' | 'svg';
}

/**
 * Export a disease map as PNG using the server-side rendering API
 */
export async function exportMap(options: ExportMapOptions): Promise<void> {
  try {
    // Default to PNG if exportType is not specified
    const exportType = options.exportType || 'png';
    
    // Call the server-side API to generate the map image
    const response = await fetch('/api/export/map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      let errorMsg = 'Failed to export map';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.details || errorMsg;
      } catch (e) {
        // If parsing fails, use the default error message
      }
      throw new Error(errorMsg);
    }

    // Get the image blob and download it
    const blob = await response.blob();
    const fileName = `${options.disease.replace(/\s+/g, '-').toLowerCase()}-${options.metric}-${new Date().toISOString().split('T')[0]}.${exportType}`;
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Error exporting map:', error);
    // Show error to user
    throw error;
  }
}

/**
 * Export a map for comparison view
 */
export async function exportComparisonMap(
  maps: any[], 
  options?: {
    title?: string;
    includeCredits?: boolean;
    simplifiedView?: boolean;
    exportType?: 'png' | 'svg';
  }
): Promise<void> {
  try {
    const exportType = options?.exportType || 'png';
    
    // Call the server-side API to generate the comparison map image
    const response = await fetch('/api/export/comparison', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maps,
        title: options?.title || 'Disease Comparison',
        includeCredits: options?.includeCredits !== undefined ? options.includeCredits : true,
        simplifiedView: options?.simplifiedView || false,
        exportType
      }),
    });

    if (!response.ok) {
      let errorMsg = 'Failed to export comparison map';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.details || errorMsg;
      } catch (e) {
        // If parsing fails, use the default error message
      }
      throw new Error(errorMsg);
    }

    // Get the image blob and download it
    const blob = await response.blob();
    saveAs(blob, `disease-comparison-${new Date().toISOString().split('T')[0]}.${exportType}`);
  } catch (error) {
    console.error('Error exporting comparison map:', error);
    // Show error to user
    throw error;
  }
}

/**
 * Export uploaded data map
 */
export async function exportUploadMap(
  data: any, 
  colorScheme: ColorScheme, 
  options?: {
    title?: string;
    description?: string;
    showLabels?: boolean;
    showLegend?: boolean;
    includeCredits?: boolean;
    exportType?: 'png' | 'svg';
  }
): Promise<void> {
  try {
    const exportType = options?.exportType || 'png';
    
    // Call the server-side API to generate the upload map image
    const response = await fetch('/api/export/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        colorScheme,
        title: options?.title || 'Custom Data Map',
        description: options?.description,
        showLabels: options?.showLabels || false,
        showLegend: options?.showLegend || true,
        includeCredits: options?.includeCredits !== undefined ? options.includeCredits : true
      }),
    });

    if (!response.ok) {
      let errorMsg = 'Failed to export custom map';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.details || errorMsg;
      } catch (e) {
        // If parsing fails, use the default error message
      }
      throw new Error(errorMsg);
    }

    // Get the image blob and download it
    const blob = await response.blob();
    saveAs(blob, `custom-map-${new Date().toISOString().split('T')[0]}.${exportType}`);
  } catch (error) {
    console.error('Error exporting custom map:', error);
    // Show error to user
    throw error;
  }
} 