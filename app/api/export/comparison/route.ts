import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: Request) {
  try {
    const { maps, title, includeCredits, simplifiedView, exportType = 'png' } = await req.json();
    
    // Validate input
    if (!maps || !Array.isArray(maps) || maps.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input: maps array is required' },
        { status: 400 }
      );
    }

    // Prepare comparison data
    const comparisonData = {
      maps,
      title: title || 'Disease Comparison',
      includeCredits: includeCredits !== false,
      simplifiedView: simplifiedView === true
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
    
    console.log('Using base URL for comparison export:', baseUrl);

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1600,1200'
      ]
    });

    try {
      // Calculate grid layout
      const mapCount = maps.length;
      const columns = mapCount <= 2 ? mapCount : Math.min(2, mapCount);
      const rows = Math.ceil(mapCount / columns);
      
      // Set page size for final composition
      // For simplified view, reduce or eliminate sections
      const titleHeight = simplifiedView ? 0 : 120; // Height for title section
      const creditsHeight = (includeCredits && !simplifiedView) ? 80 : 0; // Height for credits section
      const mapHeight = 600; // Fixed height for each map
      const mapWidth = 800; // Fixed width for each map
      const padding = 20; // Padding between maps
      
      const pageWidth = (mapWidth * columns) + (padding * (columns + 1));
      const pageHeight = titleHeight + (mapHeight * rows) + (padding * (rows + 1)) + creditsHeight;
      
      // Create main page for combining the map images
      const mainPage = await browser.newPage();
      await mainPage.setViewport({ 
        width: pageWidth,
        height: pageHeight,
        deviceScaleFactor: 1.5 // For higher resolution
      });

      // Capture individual map images first by calling the API endpoint directly
      const mapImages = [];
      for (let i = 0; i < maps.length; i++) {
        const mapData = maps[i];
        console.log(`Rendering map ${i+1}/${maps.length}: ${mapData.disease}`);
        
        try {
          // Make a direct API call to export-map endpoint to get the map image
          const response = await fetch(`${baseUrl}/api/export/map`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              disease: mapData.disease,
              metric: mapData.metric,
              view: mapData.view,
              colorScheme: mapData.colorScheme,
              timeRange: mapData.timeRange,
              showLabels: mapData.showLabels,
              showLegend: !simplifiedView,
              showTop5: !simplifiedView,
              simplifiedView: simplifiedView
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to export map: ${response.statusText}`);
          }
          
          const imageBuffer = await response.arrayBuffer();
          
          mapImages.push({
            disease: mapData.disease,
            metric: mapData.metric,
            view: mapData.view,
            timeRange: mapData.timeRange,
            image: Buffer.from(imageBuffer).toString('base64')
          });
          
          console.log(`Successfully captured map ${i+1}`);
        } catch (err) {
          console.error(`Error capturing map ${i+1}:`, err);
        }
      }

      // If we couldn't capture any maps, throw an error
      if (mapImages.length === 0) {
        throw new Error('Failed to capture any map images');
      }

      // Create HTML template for the comparison
      let htmlTemplate;
      
      if (simplifiedView) {
        // Simplified template with minimal UI, just maps and simple captions
        htmlTemplate = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Map Comparison</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: white;
                }
                .container {
                  width: ${pageWidth}px;
                  height: ${pageHeight}px;
                  padding: ${padding}px;
                  box-sizing: border-box;
                }
                .grid {
                  display: grid;
                  grid-template-columns: repeat(${columns}, 1fr);
                  grid-gap: ${padding}px;
                }
                .map-container {
                  position: relative;
                  height: ${mapHeight}px;
                  overflow: hidden;
                  background: white;
                }
                .map-caption {
                  position: absolute;
                  bottom: 10px;
                  left: 10px;
                  background: rgba(255, 255, 255, 0.8);
                  padding: 5px 10px;
                  border-radius: 4px;
                  font-size: 12px;
                  color: #1e293b;
                }
                .map-content {
                  height: 100%;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                }
                .map-content img {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="grid">
                  ${mapImages.map(mapInfo => `
                    <div class="map-container">
                      <div class="map-content">
                        <img src="data:image/png;base64,${mapInfo.image}" alt="${mapInfo.disease} map">
                      </div>
                      <div class="map-caption">
                        ${mapInfo.disease}: ${mapInfo.metric === 'cases' ? 'Cases' : 'Deaths'} (${mapInfo.view})
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </body>
          </html>
        `;
      } else {
        // Original detailed template
        htmlTemplate = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Disease Comparison</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: white;
                }
                .container {
                  width: ${pageWidth}px;
                  height: ${pageHeight}px;
                  padding: ${padding}px;
                  box-sizing: border-box;
                }
                .header {
                  text-align: center;
                  margin-bottom: ${padding}px;
                }
                .header h1 {
                  font-size: 32px;
                  color: #1e293b;
                  margin: 0 0 10px 0;
                }
                .grid {
                  display: grid;
                  grid-template-columns: repeat(${columns}, 1fr);
                  grid-gap: ${padding}px;
                }
                .map-container {
                  position: relative;
                  height: ${mapHeight}px;
                  border: 1px solid #e2e8f0;
                  border-radius: 6px;
                  overflow: hidden;
                  background: white;
                }
                .map-header {
                  background: #f8fafc;
                  padding: 10px;
                  border-bottom: 1px solid #e2e8f0;
                }
                .map-header h2 {
                  margin: 0;
                  font-size: 18px;
                  color: #1e293b;
                }
                .map-header p {
                  margin: 5px 0 0 0;
                  font-size: 12px;
                  color: #64748b;
                }
                .map-content {
                  height: calc(100% - 60px);
                  display: flex;
                  justify-content: center;
                  align-items: center;
                }
                .map-content img {
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
                }
                .footer {
                  margin-top: ${padding}px;
                  display: flex;
                  justify-content: space-between;
                  color: #64748b;
                  font-size: 14px;
                  padding-top: 15px;
                  border-top: 1px solid #e2e8f0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>${comparisonData.title}</h1>
                </div>
                <div class="grid">
                  ${mapImages.map(mapInfo => `
                    <div class="map-container">
                      <div class="map-header">
                        <h2>${mapInfo.disease}</h2>
                        <p>${mapInfo.metric === 'cases' ? 'Cases' : 'Deaths'} by ${mapInfo.view}
                        (${new Date(mapInfo.timeRange.start).toLocaleDateString()} - 
                        ${new Date(mapInfo.timeRange.end).toLocaleDateString()})</p>
                      </div>
                      <div class="map-content">
                        <img src="data:image/png;base64,${mapInfo.image}" alt="${mapInfo.disease} map">
                      </div>
                    </div>
                  `).join('')}
                </div>
                ${includeCredits ? `
                  <div class="footer">
                    <div>Disease Dashboard | Generated on ${new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</div>
                    <div>Data source: Disease Surveillance System</div>
                  </div>
                ` : ''}
              </div>
            </body>
          </html>
        `;
      }

      // Set the HTML content to the page
      await mainPage.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
      
      // Take screenshot of the final composition
      const finalScreenshot = await mainPage.screenshot({
        type: exportType === 'svg' ? 'jpeg' : exportType, // Fallback to jpeg if SVG requested (since puppeteer doesn't support SVG screenshots)
        fullPage: true
      });

      return new NextResponse(finalScreenshot, {
        headers: {
          'Content-Type': exportType === 'svg' ? 'image/jpeg' : `image/${exportType}`,
          'Content-Disposition': `attachment; filename="disease-comparison-${new Date().toISOString().split('T')[0]}.${exportType === 'svg' ? 'jpg' : exportType}"`
        }
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Export comparison error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate comparison export',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 