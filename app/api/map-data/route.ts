import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'india_district.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const mapData = JSON.parse(fileContents);
    
    return NextResponse.json(mapData);
  } catch (error) {
    console.error('Error loading map data:', error);
    return NextResponse.json(
      { error: 'Failed to load map data' },
      { status: 500 }
    );
  }
} 