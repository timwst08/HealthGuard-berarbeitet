
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { RadarDataItem, LineChartDataItem } from '../types';

interface RadarChartProps {
    data: RadarDataItem[];
}

export const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!ref.current || data.length === 0) return;

        const container = d3.select(ref.current);
        container.selectAll("*").remove();
        
        const parent = container.node()?.parentElement;
        if (!parent) return;

        const width = parent.clientWidth;
        const height = parent.clientHeight;
        const margin = { top: 30, right: 30, bottom: 30, left: 30 };
        const radius = Math.min(width, height) / 2 - Math.max(...Object.values(margin));

        if (radius <= 0) return;

        const svg = container.attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const rScale = d3.scaleLinear().range([0, radius]).domain([0, 1]);
        const angleSlice = (Math.PI * 2) / data.length;

        // Grid lines
        svg.selectAll(".grid-level")
            .data(d3.range(1, 5).reverse())
            .enter()
            .append("circle")
            .attr("r", d => (radius / 4) * d)
            .style("fill", "rgba(255, 255, 255, 0.05)")
            .style("stroke", "rgba(255, 255, 255, 0.2)")
            .style("stroke-width", "0.5px");

        // Axis lines and labels
        const axis = svg.selectAll(".axis")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "axis");

        axis.append("line")
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", (d, i) => rScale(1.1) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y2", (d, i) => rScale(1.1) * Math.sin(angleSlice * i - Math.PI / 2))
            .style("stroke", "rgba(255, 255, 255, 0.2)").style("stroke-width", "0.5px");

        axis.append("text")
            .attr("x", (d, i) => rScale(1.2) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => rScale(1.2) * Math.sin(angleSlice * i - Math.PI / 2))
            .text(d => d.axis)
            .style("fill", "white").style("font-size", "10px")
            .style("text-anchor", "middle").style("dominant-baseline", "middle");

        // Radar area
        const radarLine = d3.lineRadial<RadarDataItem>()
            .angle((d, i) => i * angleSlice)
            .radius(d => rScale(d.value))
            .curve(d3.curveLinearClosed);

        svg.append("path")
            .datum(data)
            .attr("d", radarLine)
            .style("fill", "rgba(255, 255, 255, 0.5)")
            .style("stroke", "white").style("stroke-width", "2px");
    }, [data]);

    return <svg ref={ref} className="w-full h-full" />;
};


interface LineChartProps {
    data: LineChartDataItem[];
    color: string;
    yDomain: [number, number];
}

export const LineChart: React.FC<LineChartProps> = ({ data, color, yDomain }) => {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!ref.current || data.length === 0) return;

        const container = d3.select(ref.current);
        container.selectAll("*").remove();

        const parent = container.node()?.parentElement;
        if (!parent) return;

        const width = parent.clientWidth;
        const height = parent.clientHeight;
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        if (innerWidth <= 0 || innerHeight <= 0) return;

        const svg = container.attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        const xExtent = d3.extent(data, d => d.time) as [Date, Date];
        const xScale = d3.scaleTime().domain(xExtent).range([0, innerWidth]);
        const yScale = d3.scaleLinear().domain(yDomain).range([innerHeight, 0]).nice();

        svg.append("g")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(d3.timeHour.every(6)).tickFormat(d3.timeFormat("%H:%M") as any))
            .call(g => g.select(".domain").remove())
            .selectAll("text").attr("class", "text-gray-500 text-xs");

        svg.append("g")
            .call(d3.axisLeft(yScale).ticks(5))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").clone().attr("x2", innerWidth).attr("stroke-opacity", 0.1))
            .selectAll("text").attr("class", "text-gray-500 text-xs");
            
        const area = d3.area<LineChartDataItem>()
            .x(d => xScale(d.time))
            .y0(innerHeight)
            .y1(d => yScale(d.value))
            .curve(d3.curveMonotoneX);

        svg.append("path")
            .datum(data)
            .attr("fill", `rgba(${d3.color(color)?.r}, ${d3.color(color)?.g}, ${d3.color(color)?.b}, 0.1)`)
            .attr("d", area);

        const line = d3.line<LineChartDataItem>()
            .x(d => xScale(d.time))
            .y(d => yScale(d.value))
            .curve(d3.curveMonotoneX);

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("d", line);

    }, [data, color, yDomain]);

    return <svg ref={ref} className="w-full h-full" />;
};

interface BarChartProps {
    data: { name: string; value: number; color: string }[];
}

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!ref.current || data.length === 0) return;
        const container = d3.select(ref.current);
        container.selectAll("*").remove();

        const parent = container.node()?.parentElement;
        if (!parent) return;

        const width = parent.clientWidth;
        const height = parent.clientHeight;
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        if (innerWidth <= 0 || innerHeight <= 0) return;
        
        const svg = container.attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleBand()
            .domain(data.map(d => d.name))
            .range([0, innerWidth])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value) || 0])
            .range([innerHeight, 0]).nice();
        
        svg.append("g")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text").attr("class", "text-gray-500 text-xs");

        svg.append("g")
            .call(d3.axisLeft(yScale).ticks(5))
            .selectAll("text").attr("class", "text-gray-500 text-xs");

        svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d.name) as number)
            .attr("y", d => yScale(d.value))
            .attr("width", xScale.bandwidth())
            .attr("height", d => innerHeight - yScale(d.value))
            .attr("fill", d => d.color);

    }, [data]);

    return <svg ref={ref} className="w-full h-full" />;
}
