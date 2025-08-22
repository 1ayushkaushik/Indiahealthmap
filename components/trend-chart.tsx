'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export function TrendChart() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Sample data
    const data = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2024, 0, i + 1),
      value: Math.random() * 100 + 50
    }));

    // Set up dimensions
    const width = 600;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear existing content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) as number])
      .range([height - margin.bottom, margin.top]);

    // Create line generator
    const line = d3.line<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(5));

    // Add line
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#0ea5e9')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add area
    const area = d3.area<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y0(yScale(0))
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', '#0ea5e920')
      .attr('d', area);

  }, []);

  return (
    <div className="w-full h-[200px] overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
} 