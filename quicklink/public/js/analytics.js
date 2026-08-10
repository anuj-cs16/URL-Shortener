/**
 * @file       analytics.js
 * @description Client-side logic for the general Traffic Analytics dashboard.
 *              Integrates Chart.js widgets, date selectors, skeleton views, and stats counters.
 * @module     public/js/analytics
 */

'use strict';

// ── GLOBAL STATE & CHART INSTANCES ────────────────────────
let clicksChartInstance = null;
let deviceChartInstance = null;
let browserChartInstance = null;
let countryChartInstance = null;
let referrerChartInstance = null;

// ── DOM SELECTORS ──────────────────────────────────────────
const navUsername = document.getElementById('nav-username');
const navLogoutBtn = document.getElementById('nav-logout-btn');
const toastContainer = document.getElementById('toast-container');

// Stats Elements
const statTotalUrls = document.getElementById('stat-total-urls');
const statTotalClicks = document.getElementById('stat-total-clicks');
const statMonthUrls = document.getElementById('stat-month-urls');
const statMonthClicks = document.getElementById('stat-month-clicks');

// Table Elements
const topUrlsTableBody = document.getElementById('top-urls-table-body');
const topUrlsEmpty = document.getElementById('top-urls-empty');
const recentClicksTableBody = document.getElementById('recent-clicks-table-body');
const recentClicksEmpty = document.getElementById('recent-clicks-empty');

// Date Buttons
const dateRangeButtons = document.querySelectorAll('.date-range-btn');

// ── HELPER: DESTROY & RECREATE CHART ──────────────────────
/**
 * Safe utility to prevent Chart.js reuse-canvas warning errors.
 * @param {Chart} chartInstance - Active chart reference.
 * @returns {null}
 */
const destroyChart = (chartInstance) => {
  if (chartInstance) {
    chartInstance.destroy();
  }
  return null;
};

// ── HELPER: SKELETON LOADER TOGGLE ────────────────────────
/**
 * Adds or removes skeleton classes on key dashboard elements.
 * @param {boolean} active - Indicator.
 */
const toggleSkeletons = (active) => {
  const elements = [statTotalUrls, statTotalClicks, statMonthUrls, statMonthClicks];
  elements.forEach((el) => {
    if (active) {
      el.classList.add('skeleton');
      el.textContent = '—';
    } else {
      el.classList.remove('skeleton');
    }
  });
};

// ── HELPER: COUNT-UP ANIMATION ────────────────────────────
/**
 * Animates counting numbers from zero to target.
 * @param {HTMLSpanElement} el - Output node.
 * @param {number} target - Terminal count limit.
 */
const animateCountValue = (el, target) => {
  if (target === 0) {
    el.textContent = '0';
    return;
  }
  const duration = 1000;
  const start = 0;
  const startTime = performance.now();

  const updateCount = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic easing
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(start + easeProgress * (target - start));
    
    el.textContent = value.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(updateCount);
    } else {
      el.textContent = target.toLocaleString();
    }
  };

  requestAnimationFrame(updateCount);
};

// ── HELPER: TOAST ALERTS ──────────────────────────────────
/**
 * Renders notifications.
 */
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

// ── API: LOAD DASHBOARD CORE STATS ───────────────────────
const loadDashboardStats = async () => {
  toggleSkeletons(true);
  try {
    const response = await fetch('/api/analytics/dashboard');
    if (response.status === 401) {
      window.location.href = 'index.html';
      return;
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to load stats');
    }

    const { data } = result;
    toggleSkeletons(false);

    // Animate stats
    animateCountValue(statTotalUrls, data.totalUrls || 0);
    animateCountValue(statTotalClicks, data.totalClicks || 0);
    animateCountValue(statMonthUrls, data.urlsThisMonth || 0);
    animateCountValue(statMonthClicks, data.clicksThisMonth || 0);

    // Populate recent clicks logs
    populateRecentClicks(data.recentClicks || []);
  } catch (error) {
    console.error('Stats loading error:', error);
    showToast('Failed to load dashboard metrics', 'error');
  }
};

// ── API: LOAD CLICKS OVER TIME LINE CHART ──────────────────
const loadClicksChart = async (days) => {
  try {
    const response = await fetch(`/api/analytics/clicks-over-time?days=${days}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    const labels = result.data.map(item => item.date);
    const clicks = result.data.map(item => item.clicks);

    clicksChartInstance = destroyChart(clicksChartInstance);

    const ctx = document.getElementById('clicks-chart').getContext('2d');
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
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  } catch (error) {
    console.error('Clicks chart loading error:', error);
  }
};

// ── API: LOAD DEVICE PIE/DOUGHNUT CHART ──────────────────
const loadDeviceChart = async () => {
  try {
    const response = await fetch('/api/analytics/devices');
    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    const { data } = result;
    const labels = ['Desktop', 'Mobile', 'Tablet', 'Unknown'];
    const counts = [
      data.desktop.count,
      data.mobile.count,
      data.tablet.count,
      data.unknown.count
    ];

    // Filter out items with 0 count to prevent cluttering legend
    const hasData = counts.some(c => c > 0);
    
    deviceChartInstance = destroyChart(deviceChartInstance);
    const ctx = document.getElementById('device-chart').getContext('2d');

    if (!hasData) {
      ctx.clearRect(0, 0, 300, 300);
      document.getElementById('device-chart').parentNode.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.9rem;">No device details recorded.</div>';
      return;
    }

    deviceChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: ['#6C63FF', '#3ECFCF', '#FF6B6B', 'rgba(255, 255, 255, 0.15)'],
          borderWidth: 2,
          borderColor: '#1a1a2e'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 15 } }
        }
      }
    });
  } catch (error) {
    console.error('Device chart loading error:', error);
  }
};

// ── API: LOAD BROWSER HORIZONTAL BAR CHART ───────────────
const loadBrowserChart = async () => {
  try {
    const response = await fetch('/api/analytics/browsers');
    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    const list = result.data || [];
    if (list.length === 0) {
      document.getElementById('browser-chart').parentNode.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.9rem;">No browser details recorded.</div>';
      return;
    }

    const labels = list.map(item => item.browser);
    const data = list.map(item => item.count);

    browserChartInstance = destroyChart(browserChartInstance);
    const ctx = document.getElementById('browser-chart').getContext('2d');

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
          y: {
            grid: { display: false }
          }
        }
      }
    });
  } catch (error) {
    console.error('Browser chart loading error:', error);
  }
};

// ── API: LOAD COUNTRY BAR CHART ──────────────────────────
const loadCountryChart = async () => {
  try {
    const response = await fetch('/api/analytics/countries');
    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    const list = result.data || [];
    if (list.length === 0) {
      document.getElementById('country-chart').parentNode.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.9rem;">No location details recorded.</div>';
      return;
    }

    // Convert country code to Flag Emoji
    const getFlagEmoji = (countryCode) => {
      if (!countryCode || countryCode === 'XX') return '🏳️';
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char =>  127397 + char.charCodeAt(0));
      try {
        return String.fromCodePoint(...codePoints);
      } catch (e) {
        return '🏳️';
      }
    };

    const labels = list.map(item => `${getFlagEmoji(item.countryCode)} ${item.countryCode}`);
    const data = list.map(item => item.count);

    countryChartInstance = destroyChart(countryChartInstance);
    const ctx = document.getElementById('country-chart').getContext('2d');

    countryChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: '#3ECFCF',
          borderRadius: 6,
          barThickness: 16
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  } catch (error) {
    console.error('Country chart loading error:', error);
  }
};

// ── API: LOAD REFERRER TRAFFIC CHART ──────────────────────
const loadReferrerChart = async () => {
  try {
    const response = await fetch('/api/analytics/referrers');
    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    const list = result.data || [];
    if (list.length === 0) {
      document.getElementById('referrer-chart').parentNode.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.9rem;">No traffic referrers recorded.</div>';
      return;
    }

    const labels = list.map(item => item.referrer);
    const counts = list.map(item => item.count);

    referrerChartInstance = destroyChart(referrerChartInstance);
    const ctx = document.getElementById('referrer-chart').getContext('2d');

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
        plugins: {
          legend: { position: 'bottom', labels: { padding: 15 } }
        }
      }
    });
  } catch (error) {
    console.error('Referrer chart loading error:', error);
  }
};

// ── API: LOAD TOP PERFORMING URLS ────────────────────────
const loadTopUrls = async () => {
  try {
    const response = await fetch('/api/analytics/top-urls?limit=5');
    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    const urls = result.data || [];

    if (urls.length === 0) {
      topUrlsTableBody.innerHTML = '';
      topUrlsEmpty.style.display = 'flex';
      return;
    }

    topUrlsEmpty.style.display = 'none';
    topUrlsTableBody.innerHTML = '';

    urls.forEach((url, index) => {
      const row = document.createElement('tr');
      const rank = index + 1;
      let medalClass = 'rank-other';
      let medalIcon = rank;

      if (rank === 1) {
        medalClass = 'rank-1';
        medalIcon = '🥇';
      } else if (rank === 2) {
        medalClass = 'rank-2';
        medalIcon = '🥈';
      } else if (rank === 3) {
        medalClass = 'rank-3';
        medalIcon = '🥉';
      }

      const createdDate = new Date(url.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      row.innerHTML = `
        <td>
          <span class="rank-medal ${medalClass}">${medalIcon}</span>
        </td>
        <td>
          <a href="${url.shortUrl}" target="_blank" class="history-table__short-url">
            ${url.shortUrl.replace(/^https?:\/\//, '')}
          </a>
        </td>
        <td>
          <div class="history-table__long-url" title="${url.longUrl}">
            ${url.longUrl}
          </div>
        </td>
        <td>
          <span class="history-table__clicks" style="font-weight: 700;">${url.clicks}</span>
        </td>
        <td>
          <span>${createdDate}</span>
        </td>
        <td class="text-right">
          <a href="url-analytics.html?code=${url.shortCode}" class="btn btn--outline btn--sm" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; height: 34px; width: 110px;">View Details</a>
        </td>
      `;

      topUrlsTableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Top URLs load error:', error);
  }
};

// ── POPULATE RECENT CLICKS LOGS TABLE ─────────────────────
const populateRecentClicks = (clicks) => {
  if (clicks.length === 0) {
    recentClicksTableBody.innerHTML = '';
    recentClicksEmpty.style.display = 'flex';
    return;
  }

  recentClicksEmpty.style.display = 'none';
  recentClicksTableBody.innerHTML = '';

  clicks.forEach((click) => {
    const row = document.createElement('tr');
    
    const clickTime = new Date(click.clickedAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const browserString = `${click.browser}`;
    const locationString = click.countryCode !== 'XX' ? `${click.country}` : 'Unknown Location';

    row.innerHTML = `
      <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--text-secondary);">${clickTime}</td>
      <td>
        <a href="${click.shortUrl}" target="_blank" class="history-table__short-url">
          ${click.shortUrl.replace(/^https?:\/\//, '')}
        </a>
      </td>
      <td>
        <span style="font-weight: 600;">${locationString}</span>
      </td>
      <td>
        <span class="device-badge" style="text-transform: capitalize; font-size: 0.8rem;">${click.deviceType}</span>
      </td>
      <td>
        <span style="font-size: 0.85rem;">${browserString}</span>
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
  try {
    const response = await fetch('/api/auth/me');
    const result = await response.json();

    if (result.success && result.data && result.data.user) {
      navUsername.textContent = `👤 ${result.data.user.name}`;
      
      // Initialize Dashboard components
      applyChartDefaults();
      await loadDashboardStats();
      await loadClicksChart(7);
      await loadDeviceChart();
      await loadBrowserChart();
      await loadCountryChart();
      await loadReferrerChart();
      await loadTopUrls();
    } else {
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error('Session validation error:', error);
    window.location.href = 'index.html';
  }
};

// ── BIND EVENT LISTENERS ──────────────────────────────────
dateRangeButtons.forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    dateRangeButtons.forEach((b) => b.classList.remove('active'));
    e.target.classList.add('active');
    const days = parseInt(e.target.getAttribute('data-days')) || 7;
    await loadClicksChart(days);
  });
});

navLogoutBtn.addEventListener('click', handleLogout);

window.addEventListener('DOMContentLoaded', verifySession);
