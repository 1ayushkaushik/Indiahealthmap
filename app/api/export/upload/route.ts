import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: Request) {
  try {
    const { 
      data, 
      colorScheme, 
      title, 
      description, 
      showLabels, 
      showLegend, 
      includeCredits,
      exportType = 'png'
    } = await req.json();
    
    // Validate input
    if (!data) {
      return NextResponse.json(
        { error: 'Invalid input: uploaded data is required' },
        { status: 400 }
      );
    }

    // Prepare export data
    const exportData = {
      data,
      colorScheme: colorScheme || 'teal',
      title: title || 'Custom Data Map',
      description: description || '',
      showLabels: showLabels === true,
      showLegend: showLegend !== false,
      includeCredits: includeCredits !== false
    };
    
    // Use environment variables or default for the host
    let baseUrl;
    if (process.env.NEXT_PUBLIC_APP_URL) {
      // Clean up the URL if it has quotes
      const appUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/['"\\]/g, '');
      baseUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
    } else {
      const host = process.env.NODE_ENV === 'development' ? 'localhost:3001' : 'disease-dashboard.vercel.app';
      const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
      baseUrl = `${protocol}://${host}`;
    }
    
    console.log('Using base URL for upload export:', baseUrl);
    
    // Encode data for URL
    const queryParams = new URLSearchParams({
      data: JSON.stringify(exportData)
    }).toString();
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
    
    try {
      const page = await browser.newPage();
      
      // Set larger viewport for high-quality export
      await page.setViewport({ width: 1800, height: 1800 });
    
      // Navigate to the export upload page with data
      const exportUrl = `${baseUrl}/export-upload?${queryParams}`;
      await page.goto(exportUrl, { 
        waitUntil: 'networkidle0',
        timeout: 60000  // Increased timeout for map rendering
      });
      
      // Wait for map to be fully rendered
      await page.waitForFunction(
        'document.querySelector(".leaflet-container") && !document.querySelector(".leaflet-container").classList.contains("leaflet-loading")',
        { timeout: 30000 }
      );
      
      // Allow extra time for all map elements to render
      await new Promise(resolve => setTimeout(resolve, 2000));
    
      // Take screenshot
      let screenshot;
      
      if (exportType === 'svg') {
        // For SVG export, extract SVG content
        const svgContent = await page.evaluate(() => {
          const mapElement = document.querySelector('.leaflet-container');
          if (!mapElement) return null;
          
          // Clone the map container to modify it
          const mapClone = mapElement.cloneNode(true) as HTMLElement;
          
          // Convert to SVG
          const svgData = new XMLSerializer().serializeToString(mapClone);
          return svgData;
        });
        
        if (!svgContent) {
          throw new Error('Failed to extract SVG content');
        }
        
        screenshot = Buffer.from(svgContent);
        
        return new NextResponse(screenshot, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Content-Disposition': `attachment; filename="custom-map-${new Date().toISOString().split('T')[0]}.svg"`
          }
        });
      } else {
        // Default PNG export
        screenshot = await page.screenshot({
          type: 'png',
          fullPage: true,
          omitBackground: false
        });
        
        return new NextResponse(screenshot, {
          headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment; filename="custom-map-${new Date().toISOString().split('T')[0]}.png"`
          }
        });
      }
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Export upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate custom map export',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 