import html2canvas from 'html2canvas'

interface MapConfig {
  id: string
  disease: string
  timeRange: { start: string; end: string }
  metric: 'cases' | 'deaths'
}

export async function generateComparisonImage(
  maps: MapConfig[],
  view: 'state' | 'district',
  colorScheme: 'teal' | 'blue' | 'red'
) {
  try {
    // Create a wrapper element for the comparison
    const wrapper = document.createElement('div')
    wrapper.style.width = '1800px'
    wrapper.style.height = '1200px'
    wrapper.style.backgroundColor = '#ffffff'
    wrapper.style.position = 'fixed'
    wrapper.style.left = '-9999px'
    wrapper.style.top = '0'
    wrapper.style.padding = '40px'
    wrapper.style.boxSizing = 'border-box'
    wrapper.style.display = 'flex'
    wrapper.style.flexDirection = 'column'
    
    // Add title
    const title = document.createElement('h1')
    title.textContent = 'Disease Comparison'
    title.style.fontSize = '36px'
    title.style.fontWeight = 'bold'
    title.style.marginBottom = '20px'
    title.style.textAlign = 'center'
    wrapper.appendChild(title)
    
    // Create grid for maps
    const grid = document.createElement('div')
    grid.style.display = 'grid'
    grid.style.gridTemplateColumns = maps.length <= 3 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'
    grid.style.gap = '20px'
    grid.style.flex = '1'
    wrapper.appendChild(grid)
    
    // Add maps to the document for rendering
    document.body.appendChild(wrapper)
    
    // Create map elements
    for (const map of maps) {
      const mapContainer = document.createElement('div')
      mapContainer.style.position = 'relative'
      mapContainer.style.border = '1px solid #e2e8f0'
      mapContainer.style.borderRadius = '8px'
      mapContainer.style.overflow = 'hidden'
      
      // Create iframe to render the map
      const iframe = document.createElement('iframe')
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.style.border = 'none'
      
      // Construct URL for the map
      const url = new URL(window.location.origin)
      url.pathname = '/export-map'
      url.searchParams.append('disease', map.disease)
      url.searchParams.append('metric', map.metric)
      url.searchParams.append('view', view)
      url.searchParams.append('colorScheme', colorScheme)
      url.searchParams.append('timeRange', JSON.stringify(map.timeRange))
      url.searchParams.append('showLabels', 'false')
      url.searchParams.append('comparisonMode', 'true')
      
      iframe.src = url.toString()
      mapContainer.appendChild(iframe)
      
      // Add title overlay
      const titleOverlay = document.createElement('div')
      titleOverlay.style.position = 'absolute'
      titleOverlay.style.top = '10px'
      titleOverlay.style.left = '10px'
      titleOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
      titleOverlay.style.padding = '5px 10px'
      titleOverlay.style.borderRadius = '4px'
      titleOverlay.style.fontWeight = 'bold'
      titleOverlay.textContent = `${map.disease} (${map.metric})`
      mapContainer.appendChild(titleOverlay)
      
      grid.appendChild(mapContainer)
    }
    
    // Add attribution
    const attribution = document.createElement('div')
    attribution.textContent = '@disease_visualization_dashboard_kcdh_iitb'
    attribution.style.textAlign = 'right'
    attribution.style.marginTop = '20px'
    attribution.style.fontSize = '14px'
    attribution.style.color = '#64748b'
    wrapper.appendChild(attribution)
    
    // Wait for iframes to load
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Take screenshot
    const canvas = await html2canvas(wrapper, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scale: 2,
      logging: true,
    })
    
    // Clean up
    document.body.removeChild(wrapper)
    
    // Convert to blob with maximum quality
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!)
      }, 'image/png', 1.0)
    })
    
    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `disease-comparison-${new Date().toISOString().split('T')[0]}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error generating comparison image:', error)
  }
} 