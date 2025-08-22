export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  // Detect delimiter (CSV or TSV)
  const firstLine = text.split('\n')[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';

  // Split into lines and filter out empty lines
  const lines = text.split('\n').filter(line => line.trim());

  // Extract headers from first line
  const headers = lines[0].split(delimiter).map(header => header.trim());

  // Parse remaining lines into rows
  const rows = lines.slice(1).map(line => 
    line.split(delimiter).map(cell => cell.trim())
  );

  // Validate data structure
  if (rows.some(row => row.length !== headers.length)) {
    throw new Error('Invalid data structure: inconsistent number of columns');
  }

  return { headers, rows };
} 