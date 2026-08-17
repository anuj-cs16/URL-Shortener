/**
 * @file       DeviceDoughnutChart.jsx
 * @description Doughnut chart wrapping client device types breakdown.
 * @module     components/analytics/DeviceDoughnutChart
 * @requires   react
 * @requires   react-chartjs-2
 * @requires   chart.js
 * @requires   components/common/SkeletonCard
 * @created    2026-08-12
 */

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import SkeletonCard from '../common/SkeletonCard';

ChartJS.register(ArcElement, Tooltip, Legend);

const DeviceDoughnutChart = ({ data = {}, isLoading = false }) => {
  if (isLoading) {
    return <SkeletonCard height="280px" />;
  }

  const keys = Object.keys(data);
  const labels = keys.length > 0 ? keys.map((k) => k.charAt(0).toUpperCase() + k.slice(1)) : ['No Data'];
  const values = keys.length > 0 ? Object.values(data).map((v) => v.count) : [1];
  const total = values.reduce((a, b) => a + b, 0);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: ['#6C63FF', '#3ECFCF', '#FF5252', '#FFD93D'],
        borderColor: '#16213E',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#A0A0B0',
          usePointStyle: true,
          padding: 14,
          font: {
            family: 'Inter',
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: '#16213E',
        titleColor: '#fff',
        bodyColor: '#3ECFCF',
        borderColor: '#2A2A3E',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => {
            const count = context.raw || 0;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return ` ${context.label}: ${count} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '65%',
  };

  return (
    <div className="glass-card chart-card-container">
      <h3 className="chart-title-lbl">Devices breakdown</h3>
      <div style={{ height: '200px', position: 'relative' }}>
        <Doughnut data={chartData} options={options} />
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

export default DeviceDoughnutChart;
