/**
 * @file       ClicksLineChart.jsx
 * @description Chart.js wrapper rendering click time-series data.
 * @module     components/analytics/ClicksLineChart
 * @requires   react
 * @requires   react-chartjs-2
 * @requires   chart.js
 * @requires   components/common/SkeletonCard
 * @created    2026-08-12
 */

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import SkeletonCard from '../common/SkeletonCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ClicksLineChart = ({ data = [], isLoading = false }) => {
  if (isLoading) {
    return <SkeletonCard height="300px" />;
  }

  // Pre-fill placeholder if array is empty
  const labels = data.length > 0 ? data.map((d) => d.date) : ['No Data'];
  const values = data.length > 0 ? data.map((d) => d.clicks) : [0];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Clicks',
        data: values,
        fill: true,
        borderColor: '#6C63FF',
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#6C63FF',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#6C63FF',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
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
        padding: 12,
        displayColors: false,
        titleFont: {
          family: 'Inter',
          weight: 'bold',
        },
        bodyFont: {
          family: 'Inter',
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
        },
        ticks: {
          color: '#A0A0B0',
          font: {
            family: 'Inter',
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
        },
        ticks: {
          color: '#A0A0B0',
          font: {
            family: 'Inter',
            size: 10,
          },
          precision: 0,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="glass-card chart-card-container">
      <h3 className="chart-title-lbl">Clicks Over Time</h3>
      <div style={{ height: '260px', position: 'relative' }}>
        <Line data={chartData} options={options} />
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

export default ClicksLineChart;
