/**
 * Save SVG content as a file
 * @param svgContent The SVG content to save
 * @param fileName The name of the file to save as
 */
export function saveSvg(svgContent: string, fileName: string) {
  // Create a Blob with the SVG content
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  // Create a temporary link element
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;

  // Trigger the download
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} 