export const comparisonTemplates = {
  2: `
    <div class="comparison-template" style="width: 1800px; height: 1200px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding: 32px; background: white;">
      <div id="map-1" style="height: 1136px;"></div>
      <div id="map-2" style="height: 1136px;"></div>
    </div>
  `,
  3: `
    <div class="comparison-template" style="width: 1800px; height: 1200px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding: 32px; background: white;">
      <div id="map-1" style="grid-column: 1 / -1; height: 600px;"></div>
      <div id="map-2" style="height: 500px;"></div>
      <div id="map-3" style="height: 500px;"></div>
    </div>
  `,
  4: `
    <div class="comparison-template" style="width: 1800px; height: 1200px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding: 32px; background: white;">
      <div id="map-1" style="height: 550px;"></div>
      <div id="map-2" style="height: 550px;"></div>
      <div id="map-3" style="height: 550px;"></div>
      <div id="map-4" style="height: 550px;"></div>
    </div>
  `
} as const; 