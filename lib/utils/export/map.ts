import html2canvas from 'html2canvas';
import { saveSvg } from '@/lib/utils/svg';

export async function exportMapAsPNG() {
  try {
    // Get the entire map container including legend
    const mapContainer = document.querySelector('.map-container') as HTMLElement;
    if (!mapContainer) throw new Error('Map container not found');

    // Wait for map tiles to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    const canvas = await html2canvas(mapContainer, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scale: 2,
      logging: true,
    });

    // Convert to blob with maximum quality
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', 1.0);
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `disease-map-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting map:', error);
  }
}

export async function exportMapAsSVG() {
  try {
    // Get the entire map container including legend and overlays
    const mapContainer = document.querySelector('.map-container') as HTMLElement;
    if (!mapContainer) throw new Error('Map container not found');

    // Wait for map tiles to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get all SVG elements from the map
    const mapSvg = mapContainer.querySelector('.leaflet-overlay-pane svg');
    const legendContainer = mapContainer.querySelector('.map-export-legend');
    const titleContainer = mapContainer.querySelector('.map-export-title');
    const totalContainer = mapContainer.querySelector('.map-export-total');
    const attributionContainer = mapContainer.querySelector('.map-export-attribution');
    const labelsContainer = mapContainer.querySelector('.leaflet-marker-pane');

    if (!mapSvg) throw new Error('Map SVG not found');

    // Create a new SVG that will contain everything
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '1800');
    svg.setAttribute('height', '1800');
    svg.setAttribute('viewBox', '0 0 1800 1800');

    // Add white background
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', 'white');
    svg.appendChild(background);

    // Clone and append map SVG content
    const mapContent = mapSvg.cloneNode(true) as SVGElement;
    svg.appendChild(mapContent);

    // Convert HTML elements to SVG
    if (titleContainer) {
      const titleForeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      titleForeign.setAttribute('x', '20');
      titleForeign.setAttribute('y', '20');
      titleForeign.setAttribute('width', '800');
      titleForeign.setAttribute('height', '200');
      titleForeign.innerHTML = titleContainer.innerHTML;
      svg.appendChild(titleForeign);
    }

    if (legendContainer) {
      const legendForeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      legendForeign.setAttribute('x', '20');
      legendForeign.setAttribute('y', '240');
      legendForeign.setAttribute('width', '300');
      legendForeign.setAttribute('height', '400');
      legendForeign.innerHTML = legendContainer.innerHTML;
      svg.appendChild(legendForeign);
    }

    if (totalContainer) {
      const totalForeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      totalForeign.setAttribute('x', '1400');
      totalForeign.setAttribute('y', '1500');
      totalForeign.setAttribute('width', '400');
      totalForeign.setAttribute('height', '200');
      totalForeign.innerHTML = totalContainer.innerHTML;
      svg.appendChild(totalForeign);
    }

    if (attributionContainer) {
      const attributionForeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      attributionForeign.setAttribute('x', '1500');
      attributionForeign.setAttribute('y', '1750');
      attributionForeign.setAttribute('width', '300');
      attributionForeign.setAttribute('height', '50');
      attributionForeign.innerHTML = attributionContainer.innerHTML;
      svg.appendChild(attributionForeign);
    }

    if (labelsContainer) {
      const labelsForeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      labelsForeign.setAttribute('x', '0');
      labelsForeign.setAttribute('y', '0');
      labelsForeign.setAttribute('width', '1800');
      labelsForeign.setAttribute('height', '1800');
      labelsForeign.innerHTML = labelsContainer.innerHTML;
      svg.appendChild(labelsForeign);
    }

    // Add styles
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      .map-export-title h1 { font-size: 70px; font-weight: bold; margin: 0; padding: 0; color: #000; }
      .map-export-title h2 { font-size: 24px; margin: 10px 0 0 0; padding: 0; color: #333; }
      .map-export-legend { background-color: rgba(255, 255, 255, 0.9); border-radius: 8px; }
      .legend-color { width: 24px; height: 24px; border-radius: 4px; display: inline-block; }
      .legend-label { font-size: 18px; font-weight: bold; }
      .total-count { font-size: 100px; font-weight: bold; color: #ff6b00; }
      .total-label { font-size: 40px; font-weight: bold; color: #333; }
      .state-label { font-size: 16px; font-weight: bold; text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff; }
    `;
    svg.appendChild(style);

    // Convert to string and download
    const svgString = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `disease-map-${new Date().toISOString()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting SVG:', error);
  }
} 