/**
 * @file       CountryBarChart.jsx
 * @description Vertical bar chart wrapping geographics click logs.
 * @module     components/analytics/CountryBarChart
 * @requires   react
 * @requires   react-chartjs-2
 * @requires   chart.js
 * @requires   components/common/SkeletonCard
 * @created    2026-08-12
 */

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import SkeletonCard from '../common/SkeletonCard';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const CountryBarChart = ({ data = [], isLoading = false }) => {
  if (isLoading) {
    return <SkeletonCard height="280px" />;
  }

  // Take top 10 countries
  const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 10);

  const labels = sortedData.length > 0 ? sortedData.map((d) => d.country || 'Unknown') : ['No Data'];
  const values = sortedData.length > 0 ? sortedData.map((d) => d.count) : [0];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Clicks',
        data: values,
        backgroundColor: 'rgba(62, 207, 207, 0.8)',
        hoverBackgroundColor: 'rgba(62, 207, 207, 1)',
        borderRadius: 4,
        barThickness: 18,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#16213E',
        titleColor: '#fff',
        bodyColor: '#3ECFCF',
        borderColor: '#2A2A3E',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#A0A0B0',
          font: { family: 'Inter', size: 10 },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
        },
        ticks: {
          color: '#A0A0B0',
          font: { family: 'Inter', size: 10 },
          precision: 0,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="glass-card chart-card-container">
      <h3 className="chart-title-lbl">Clicks by Country</h3>
      <div style={{ height: '200px', position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </div>
      <style>{`
        .chart-card-container {
          padding: 20px;
          border-radius: var(--radius-md);
        }
        .chart-title-lbl {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 16px;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default CountryBarChart;
