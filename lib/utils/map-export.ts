import { COLOR_SCHEMES, type ColorScheme } from '@/lib/constants/color-schemes';

function calculateThresholds(data: { [key: string]: number }): number[] {
  // Get all non-zero values
  const values = Object.values(data)
    .filter(val => val > 0)
    .sort((a, b) => b - a);

  if (values.length === 0) return [100, 50, 25, 10, 5, 2, 1, 0];

  const max = Math.max(...values);
  const quantiles = [
    max,                          // Max value
    values[Math.floor(values.length * 0.12)], // 88th percentile
    values[Math.floor(values.length * 0.25)], // 75th percentile
    values[Math.floor(values.length * 0.37)], // 63th percentile
    values[Math.floor(values.length * 0.5)],  // Median
    values[Math.floor(values.length * 0.63)], // 37th percentile
    values[Math.floor(values.length * 0.75)], // 25th percentile
    0                            // Min value
  ];

  // Round numbers for cleaner display
  return quantiles.map(val => {
    if (val >= 1000) return Math.round(val / 100) * 100;
    if (val >= 100) return Math.round(val / 10) * 10;
    return Math.round(val);
  });
}

function normalizeStateName(name: string): string {
  return name.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/And/g, 'and')
    .replace(/Of/g, 'of');
}

export const generateMapHTML = (mapData: any, colorScheme: ColorScheme, topology: any) => {
  const values: { [key: string]: number } = mapData.uploadedData ? 
    Object.fromEntries(
      Object.entries(mapData.values || {}).map(([key, value]) => [
        normalizeStateName(key),
        typeof value === 'number' ? value : 0
      ])
    ) : {};

  const thresholds = calculateThresholds(values);
  const colors = COLOR_SCHEMES[colorScheme];

  function getColor(value: number) {
    if (!value || value === 0) return '#ffffff';
    
    for (let i = 0; i < thresholds.length; i++) {
      if (value >= thresholds[i]) return colors[i];
    }
    return colors[colors.length - 1];
  }

  function formatNumber(num: number): string {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
  }

  return `
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script>
      async function renderMap() {
        const width = 1200;
        const height = 800;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        const svg = d3.select('#map')
          .append('svg')
          .attr('width', width)
          .attr('height', height);

        const projection = d3.geoMercator()
          .center([78.9629, 22.5937])
          .scale(1000)
          .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        const values = ${JSON.stringify(values)};
        const thresholds = ${JSON.stringify(thresholds)};
        const colors = ${JSON.stringify(colors)};

        function getColor(value) {
          if (!value || value === 0) return '#ffffff';
          for (let i = 0; i < thresholds.length; i++) {
            if (value >= thresholds[i]) return colors[i];
          }
          return colors[colors.length - 1];
        }

        const topology = ${JSON.stringify(topology)};

        // Draw map
        svg.selectAll('path')
          .data(topology.features)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('fill', d => {
            const name = d.properties.stateName || d.properties.name;
            const normalizedName = name.toLowerCase()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
              .replace(/And/g, 'and')
              .replace(/Of/g, 'of');
            const value = values[normalizedName] || 0;
            return getColor(value);
          })
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 0.5)
          .attr('fill-opacity', 0.7);

        // Add legend
        const legendWidth = 200;
        const legendHeight = 150;
        const legendX = width - legendWidth - 40;
        const legendY = 40;

        const legend = svg.append('g')
          .attr('transform', \`translate(\${legendX}, \${legendY})\`);

        legend.append('rect')
          .attr('width', legendWidth)
          .attr('height', legendHeight)
          .attr('fill', 'white')
          .attr('stroke', '#ddd')
          .attr('rx', 4);

        legend.append('text')
          .attr('x', 10)
          .attr('y', 25)
          .attr('font-weight', 'bold')
          .text('Cases');

        thresholds.forEach((threshold, i) => {
          if (i === thresholds.length - 1) return;

          const y = 45 + i * 20;
          
          // Color box
          legend.append('rect')
            .attr('x', 10)
            .attr('y', y)
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', colors[i])
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 0.5);

          // Label
          legend.append('text')
            .attr('x', 30)
            .attr('y', y + 10)
            .attr('font-size', '12px')
            .text(i === 0 
              ? \`≥ \${formatNumber(threshold)}\`
              : \`\${formatNumber(threshold)} - \${formatNumber(thresholds[i-1])}\`
            );
        });

        // Add the last threshold
        legend.append('rect')
          .attr('x', 10)
          .attr('y', 45 + (thresholds.length - 1) * 20)
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', colors[colors.length - 1])
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 0.5);

        legend.append('text')
          .attr('x', 30)
          .attr('y', 55 + (thresholds.length - 1) * 20)
          .attr('font-size', '12px')
          .text(\`< \${formatNumber(thresholds[thresholds.length - 2])}\`);
      }

      // Call the render function
      renderMap();
    </script>
  `;
}; 