import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { 
      disease, 
      metric, 
      view, 
      colorScheme, 
      timeRange, 
      showLabels, 
      title, 
      description, 
      includeCredits,
      showLegend = true,
      showTop5 = true,
      exportType = 'png' // Default is PNG
    } = body;

    // Validate required params
    if (!disease || !metric || !view || !timeRange) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Configure browser
    const browser = await puppeteer.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: { width: 1200, height: 800, deviceScaleFactor: 2 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    try {
      const page = await browser.newPage();
      
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
      
      console.log('Using base URL for export:', baseUrl);
      
      // Build the URL for the export page with all necessary query params
      const url = new URL(`/export-map`, baseUrl);
      url.searchParams.append('disease', disease);
      url.searchParams.append('metric', metric);
      url.searchParams.append('view', view);
      url.searchParams.append('colorScheme', colorScheme);
      url.searchParams.append('startDate', timeRange.start);
      url.searchParams.append('endDate', timeRange.end);
      url.searchParams.append('showLabels', showLabels.toString());
      
      // Add new options 
      if (title) url.searchParams.append('title', title);
      if (description) url.searchParams.append('description', description);
      url.searchParams.append('includeCredits', (!!includeCredits).toString());
      url.searchParams.append('showLegend', showLegend.toString());
      url.searchParams.append('showTop5', showTop5.toString());
      
      console.log('Navigating to export page:', url.toString());
      await page.goto(url.toString(), { waitUntil: 'networkidle0' });
      
      // Wait for map to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Looking for map element with selector #export-map-container');
      // Take a screenshot of the map container
      const mapElement = await page.$('#export-map-container');
      if (!mapElement) {
        console.error('Failed to find #export-map-container, checking page content');
        const bodyHTML = await page.evaluate(() => document.body.innerHTML);
        console.log('Page body HTML length:', bodyHTML.length);
        console.log('Page body HTML sample:', bodyHTML.substring(0, 500) + '...');
        throw new Error('Failed to find map element on export page');
      }
      
      let buffer;
      const filename = `${disease.replace(/\s+/g, '-').toLowerCase()}-${metric}-map.${exportType}`;
      
      if (exportType.toLowerCase() === 'svg') {
        // For SVG export, we need to extract SVG content
        const svgContent = await page.evaluate(() => {
          const svgElements = document.querySelectorAll('svg');
          if (svgElements.length === 0) return null;
          
          // Create a container SVG
          const container = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          container.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          container.setAttribute('width', '1800');
          container.setAttribute('height', '1800');
          
          // Clone all SVG elements into the container
          Array.from(svgElements).forEach(svg => {
            const clone = svg.cloneNode(true);
            container.appendChild(clone);
          });
          
          return container.outerHTML;
        });
        
        if (!svgContent) {
          throw new Error('Failed to extract SVG content');
        }
        
        buffer = Buffer.from(svgContent);
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      } else {
        // PNG export
        buffer = await mapElement.screenshot({ 
          type: 'png',
          omitBackground: false,
        });
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Error generating export:', error);
    return NextResponse.json(
      { error: 'Failed to generate export', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 