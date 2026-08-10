/**
 * @file       url-analytics.js
 * @description Client-side logic for the single shortened URL performance detail view.
 *              Integrates specific Chart.js widgets, progress bars, and recent visitor logs.
 * @module     public/js/url-analytics
 */

'use strict';

// ── GLOBAL STATE & CHART INSTANCES ────────────────────────
let clicksChartInstance = null;
let deviceChartInstance = null;
let browserChartInstance = null;
let referrerChartInstance = null;

// ── DOM SELECTORS ──────────────────────────────────────────
const navUsername = document.getElementById('nav-username');
const navLogoutBtn = document.getElementById('nav-logout-btn');
const toastContainer = document.getElementById('toast-container');

// URL Info Card Elements
const urlTitleHeader = document.getElementById('url-title-header');
const infoShortUrl = document.getElementById('info-short-url');
const infoLongUrl = document.getElementById('info-long-url');
const infoCopyBtn = document.getElementById('info-copy-btn');
const infoTotalClicks = document.getElementById('info-total-clicks');
const infoCreatedAt = document.getElementById('info-created-at');
const infoExpiresAt = document.getElementById('info-expires-at');

// Breakdown Containers
const countryProgressContainer = document.getElementById('country-progress-container');
const countryEmpty = document.getElementById('country-empty');
const recentClicksTableBody = document.getElementById('url-recent-clicks-table-body');
const recentClicksEmpty = document.getElementById('url-recent-clicks-empty');

// ── HELPER: DESTROY & RECREATE CHART ──────────────────────
const destroyChart = (chartInstance) => {
  if (chartInstance) {
    chartInstance.destroy();
  }
  return null;
};

// ── HELPER: TOAST ALERTS ──────────────────────────────────
const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__content">${type === 'success' ? '✅' : '❌'} ${message}</span>
    <button class="toast__close">&times;</button>
  `;
  toast.querySelector('.toast__close').addEventListener('click', () => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  });
  toastContainer.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }
  }, 3000);
};

// ── CHART.JS DEFAULTS ──────────────────────────────────────
const applyChartDefaults = () => {
  Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(20, 20, 35, 0.95)';
  Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
  Chart.defaults.plugins.tooltip.bodyColor = '#ffffff';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(108, 99, 255, 0.3)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
};

// ── API: LOAD SINGLE URL ANALYTICS DETAILS ─────────────────
const loadUrlAnalytics = async (shortCode) => {
  try {
    const response = await fetch(`/api/analytics/url/${shortCode}`);
    if (response.status === 401) {
      window.location.href = 'index.html';
      return;
    }
    if (response.status === 403) {
      showToast('You are not authorized to view this URL analytics', 'error');
      setTimeout(() => {
        window.location.href = 'analytics.html';
      }, 1500);
      return;
    }
    if (response.status === 404) {
      showToast('Short URL not found', 'error');
      setTimeout(() => {
        window.location.href = 'analytics.html';
      }, 1500);
      return;
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message);
    }

    const { data } = result;

    // 1. Populate URL Info Card
    urlTitleHeader.innerHTML = `🔗 Code: <span style="color: var(--primary-color);">${data.url.shortCode}</span>`;
    infoShortUrl.href = data.url.shortUrl;
    infoShortUrl.textContent = data.url.shortUrl.replace(/^https?:\/\//, '');
    infoLongUrl.textContent = data.url.longUrl;
    infoLongUrl.title = data.url.longUrl;
    infoLongUrl.classList.remove('skeleton-text');
    infoTotalClicks.textContent = data.url.totalClicks || 0;

    const createdDate = new Date(data.url.createdAt).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    infoCreatedAt.textContent = createdDate;

    const expiresDate = new Date(data.url.expiresAt).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    infoExpiresAt.textContent = expiresDate;

    // Bind copy button listener
    infoCopyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(data.url.shortUrl);
        const originalText = infoCopyBtn.textContent;
        infoCopyBtn.textContent = '✅ Copied';
        infoCopyBtn.classList.add('btn--success');
        showToast('Link copied to clipboard', 'success');
        setTimeout(() => {
          infoCopyBtn.textContent = originalText;
          infoCopyBtn.classList.remove('btn--success');
        }, 2000);
      } catch (err) {
        showToast('Failed to copy link', 'error');
      }
    });

    // 2. Render Clicks Over Time Chart
    renderClicksChart(data.clicksOverTime || []);

    // 3. Render Device Breakdown Chart
    renderDeviceChart(data.deviceBreakdown || {});

    // 4. Render Browser Breakdown Chart
    renderBrowserChart(data.browserBreakdown || []);

    // 5. Render Referrer Breakdown Chart
    renderReferrerChart(data.referrerBreakdown || []);

    // 6. Render Country Progress Bars
    renderCountryProgress(data.countryBreakdown || [], data.url.totalClicks || 0);

    // 7. Render Recent Clicks Table
    renderRecentClicks(data.recentClicks || []);

  } catch (error) {
    console.error('URL details loading error:', error);
    showToast('Failed to load metrics details', 'error');
  }
};

// ── RENDER CHARTS FUNCTIONS ────────────────────────────────

const renderClicksChart = (timeData) => {
  const labels = timeData.map(item => item.date);
  const clicks = timeData.map(item => item.clicks);

  clicksChartInstance = destroyChart(clicksChartInstance);
  const ctx = document.getElementById('url-clicks-chart').getContext('2d');
  
  clicksChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Clicks',
        data: clicks,
        borderColor: '#6C63FF',
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#6C63FF',
        pointHoverRadius: 6,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });
};

const renderDeviceChart = (deviceData) => {
  const labels = ['Desktop', 'Mobile', 'Tablet', 'Unknown'];
  const counts = [
    deviceData.desktop ? deviceData.desktop.count : 0,
    deviceData.mobile ? deviceData.mobile.count : 0,
    deviceData.tablet ? deviceData.tablet.count : 0,
    deviceData.unknown ? deviceData.unknown.count : 0
  ];

  const hasData = counts.some(c => c > 0);
  deviceChartInstance = destroyChart(deviceChartInstance);
  const ctx = document.getElementById('url-device-chart').getContext('2d');

  if (!hasData) {
    ctx.clearRect(0, 0, 300, 300);
    document.getElementById('url-device-chart').parentNode.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.9rem;">No device details recorded.</div>';
    return;
  }

  deviceChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: ['#6C63FF', '#3ECFCF', '#FF6B6B', 'rgba(255,255,255,0.15)'],
        borderWidth: 2,
        borderColor: '#1a1a2e'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: { legend: { position: 'bottom' } }
    }
  });
};

const renderBrowserChart = (browsersList) => {
  if (browsersList.length === 0) {
    document.getElementById('url-browser-chart').parentNode.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.9rem;">No browser details recorded.</div>';
    return;
  }

  const labels = browsersList.map(item => item.browser);
  const data = browsersList.map(item => item.count);

  browserChartInstance = destroyChart(browserChartInstance);
  const ctx = document.getElementById('url-browser-chart').getContext('2d');

  browserChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: 'rgba(108, 99, 255, 0.85)',
        borderRadius: 6,
        barThickness: 18
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { precision: 0 },
          beginAtZero: true
        },
        y: { grid: { display: false } }
      }
    }
  });
};

const renderReferrerChart = (referrersList) => {
  if (referrersList.length === 0) {
    document.getElementById('url-referrer-chart').parentNode.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.9rem;">No traffic referrers recorded.</div>';
    return;
  }

  const labels = referrersList.map(item => item.referrer);
  const counts = referrersList.map(item => item.count);

  referrerChartInstance = destroyChart(referrerChartInstance);
  const ctx = document.getElementById('url-referrer-chart').getContext('2d');

  referrerChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', 'rgba(255,255,255,0.15)'],
        borderWidth: 2,
        borderColor: '#1a1a2e'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: { legend: { position: 'bottom' } }
    }
  });
};

// ── RENDER COUNTRY PROGRESS BARS ──────────────────────────
const renderCountryProgress = (countries, totalClicks) => {
  if (countries.length === 0) {
    countryProgressContainer.innerHTML = '';
    countryEmpty.style.display = 'flex';
    return;
  }

  countryEmpty.style.display = 'none';
  countryProgressContainer.innerHTML = '';

  const getFlagEmoji = (countryCode) => {
    if (!countryCode || countryCode === 'XX') return '🏳️';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    try {
      return String.fromCodePoint(...codePoints);
    } catch (e) {
      return '🏳️';
    }
  };

  countries.forEach((item) => {
    const pct = totalClicks > 0 ? Math.round((item.count / totalClicks) * 100) : 0;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'progress-item';
    wrapper.innerHTML = `
      <div class="progress-header">
        <span>${getFlagEmoji(item.countryCode)} ${item.country}</span>
        <span style="color: var(--text-secondary);">${item.count} clicks (${pct}%)</span>
      </div>
      <div class="progress-bar-wrapper">
        <div class="progress-bar-fill" style="width: 0%;"></div>
      </div>
    `;

    countryProgressContainer.appendChild(wrapper);

    // Trigger visual progress animation trigger
    setTimeout(() => {
      const fill = wrapper.querySelector('.progress-bar-fill');
      if (fill) fill.style.width = `${pct}%`;
    }, 100);
  });
};

// ── RENDER RECENT VISITOR LOG ROWS ────────────────────────
const renderRecentClicks = (clicks) => {
  if (clicks.length === 0) {
    recentClicksTableBody.innerHTML = '';
    recentClicksEmpty.style.display = 'flex';
    return;
  }

  recentClicksEmpty.style.display = 'none';
  recentClicksTableBody.innerHTML = '';

  clicks.forEach((click) => {
    const row = document.createElement('tr');
    
    const timeStr = new Date(click.clickedAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const locationStr = click.countryCode !== 'XX' ? `${click.city}, ${click.country}` : 'Unknown Location';

    row.innerHTML = `
      <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--text-secondary);">${timeStr}</td>
      <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;">${click.ipAddress}</td>
      <td>
        <span style="font-weight: 600;">${locationStr}</span>
      </td>
      <td>
        <span class="device-badge" style="text-transform: capitalize; font-size: 0.8rem;">${click.deviceType}</span>
      </td>
      <td>
        <span style="font-size: 0.85rem;">${click.browser} (${click.operatingSystem})</span>
      </td>
      <td>
        <span style="font-size: 0.85rem; color: var(--text-secondary);">${click.referrer}</span>
      </td>
    `;

    recentClicksTableBody.appendChild(row);
  });
};

// ── LOGOUT SESSION TRIGGER ────────────────────────────────
const handleLogout = async () => {
  try {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    const result = await response.json();
    if (result.success) {
      showToast('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 800);
    } else {
      showToast('Failed to logout', 'error');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Failed to connect to server', 'error');
  }
};

// ── SESSION VERIFICATION ON LOAD ──────────────────────────
const verifySession = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const shortCode = urlParams.get('code');

  if (!shortCode) {
    window.location.href = 'analytics.html';
    return;
  }

  try {
    const response = await fetch('/api/auth/me');
    const result = await response.json();

    if (result.success && result.data && result.data.user) {
      navUsername.textContent = `👤 ${result.data.user.name}`;
      
      applyChartDefaults();
      await loadUrlAnalytics(shortCode);
    } else {
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error('Session validation error:', error);
    window.location.href = 'index.html';
  }
};

navLogoutBtn.addEventListener('click', handleLogout);

window.addEventListener('DOMContentLoaded', verifySession);
