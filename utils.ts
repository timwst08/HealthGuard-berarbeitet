
import { LineChartDataItem } from './types';

// Generates a plausible 24-hour heart rate dataset
export const generateHeartRateData = (average: number, min: number, max: number): LineChartDataItem[] => {
    const data: LineChartDataItem[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
        const time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i, 0, 0);
        // Simulate daily rhythm: lower at night, higher during the day
        const dailyRhythm = Math.sin((i - 6) * Math.PI / 12) * ((max - min) / 4);
        let value = average + dailyRhythm + (Math.random() - 0.5) * 10;
        value = Math.max(min, Math.min(max, value)); // Clamp within min/max
        data.push({ time, value: Math.round(value) });
    }
    return data;
};

// Generates generic time-series data for other metrics
export const generateGenericMetricData = (currentValue: number, fluctuation: number = 0.1): LineChartDataItem[] => {
    const data: LineChartDataItem[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
        const time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i, 0, 0);
        let value = currentValue * (1 + (Math.random() - 0.5) * fluctuation);
        data.push({ time, value });
    }
    return data;
};

// Generates plausible sleep stage data
export const generateSleepData = (totalHours: number): { name: string, value: number, color: string }[] => {
    const deepRatio = 0.20; // 20% deep sleep
    const remRatio = 0.25;  // 25% REM sleep
    const lightRatio = 0.55; // 55% light sleep

    return [
        { name: 'Tief', value: totalHours * deepRatio, color: '#1e3a8a' },
        { name: 'REM', value: totalHours * remRatio, color: '#3b82f6' },
        { name: 'Leicht', value: totalHours * lightRatio, color: '#93c5fd' },
    ];
};
