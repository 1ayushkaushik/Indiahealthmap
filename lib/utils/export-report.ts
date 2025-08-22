import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useFilterStore } from '@/lib/store';

/**
 * Export a detailed disease report as PDF
 */
export async function exportReport() {
  try {
    const pdf = new jsPDF('p', 'px', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 40;

    // Get current filter state
    const state = useFilterStore.getState();
    const { disease, view, timeRange } = state;

    // Fetch all data for the report
    const params = new URLSearchParams({
      disease: encodeURIComponent(disease),
      view,
      start: timeRange.start,
      end: timeRange.end
    });

    const response = await fetch(`/api/disease-data?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch disease data: ${response.status}`);
    }
    
    const data = await response.json();
    
    const tableData = Object.entries(data).map(([name, stats]) => {
      // Add runtime checks to ensure the data has the expected structure
      const casesValue = stats && typeof stats === 'object' && 'cases' in stats ? 
        (stats.cases as number) : 0;
      const deathsValue = stats && typeof stats === 'object' && 'deaths' in stats ? 
        (stats.deaths as number) : 0;
      
      return {
        name,
        cases: casesValue,
        deaths: deathsValue,
        mortality: casesValue > 0 ? ((deathsValue / casesValue) * 100).toFixed(2) + '%' : '0%'
      };
    }).sort((a, b) => b.cases - a.cases);

    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loadingIndicator.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mb-4"></div>
        <p class="text-lg font-medium">Generating report...</p>
        <p class="text-sm text-slate-500 mt-2">This may take a few seconds</p>
      </div>
    `;
    document.body.appendChild(loadingIndicator);

    // Capture map
    const mapElement = document.querySelector('.map-container') as HTMLElement;
    if (!mapElement) throw new Error('Map element not found');

    const mapCanvas = await html2canvas(mapElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    const mapImage = mapCanvas.toDataURL('image/png');
    
    // Capture chart
    const chartElement = document.querySelector('.chart-container') as HTMLElement;
    if (!chartElement) throw new Error('Chart element not found');
    
    const chartCanvas = await html2canvas(chartElement, {
      scale: 2,
      backgroundColor: '#ffffff'
    });
    const chartImage = chartCanvas.toDataURL('image/png');

    // Remove loading indicator
    document.body.removeChild(loadingIndicator);

    // Add title and metadata
    pdf.setFontSize(20);
    pdf.text('Disease Report', margin, margin);
    pdf.setFontSize(12);
    const today = new Date().toLocaleDateString();
    pdf.text(`Generated on ${today}`, margin, margin + 20);
    pdf.text(`Disease: ${disease}`, margin, margin + 35);
    pdf.text(`View Level: ${view}`, margin, margin + 50);
    pdf.text(`Period: ${new Date(timeRange.start).toLocaleDateString()} - ${new Date(timeRange.end).toLocaleDateString()}`, margin, margin + 65);

    // Add map
    const mapWidth = pageWidth - (margin * 2);
    const mapHeight = (mapWidth * mapCanvas.height) / mapCanvas.width;
    pdf.addImage(mapImage, 'PNG', margin, margin + 80, mapWidth, mapHeight);

    // Add chart on new page
    pdf.addPage();
    const chartWidth = pageWidth - (margin * 2);
    const chartHeight = (chartWidth * chartCanvas.height) / chartCanvas.width;
    pdf.addImage(chartImage, 'PNG', margin, margin, chartWidth, chartHeight);

    // Add data table on new page(s)
    pdf.addPage();
    pdf.text('Detailed Data', margin, margin);
    
    autoTable(pdf, {
      head: [['Region', 'Cases', 'Deaths', 'Mortality Rate']],
      body: tableData.map(row => [
        row.name,
        row.cases.toLocaleString(),
        row.deaths.toLocaleString(),
        row.mortality
      ]),
      startY: margin + 20,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [41, 37, 36] },
      styles: { font: 'helvetica', fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    // Add summary
    const totalCases = tableData.reduce((sum, row) => sum + row.cases, 0);
    const totalDeaths = tableData.reduce((sum, row) => sum + row.deaths, 0);
    const overallMortality = totalCases > 0 
      ? ((totalDeaths / totalCases) * 100).toFixed(2) + '%' 
      : '0%';

    pdf.addPage();
    pdf.text('Summary', margin, margin);
    pdf.text(`Total Cases: ${totalCases.toLocaleString()}`, margin, margin + 20);
    pdf.text(`Total Deaths: ${totalDeaths.toLocaleString()}`, margin, margin + 35);
    pdf.text(`Overall Mortality Rate: ${overallMortality}`, margin, margin + 50);

    // Save PDF
    pdf.save(`${disease.toLowerCase().replace(/\s+/g, '-')}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
} 