/**
 * @file       main.js
 * @description Frontend script for managing URL shortening, clipboard actions, QR code rendering, and URL history.
 * @module     public/js/main
 */

'use strict';

// ── DOM Element Selectors ──────────────────────────────────
const shortenForm = document.getElementById('shorten-form');
const urlInput = document.getElementById('url-input');
const aliasInput = document.getElementById('alias-input');
const submitBtn = document.getElementById('submit-btn');
const urlError = document.getElementById('url-input-error');
const aliasError = document.getElementById('alias-input-error');

const resultSection = document.getElementById('result-section');
const shortUrlDisplay = document.getElementById('short-url-display');
const copyBtn = document.getElementById('copy-btn');
const qrImage = document.getElementById('qr-image');
const downloadQrBtn = document.getElementById('download-qr-btn');
const resetFormBtn = document.getElementById('reset-form-btn');

const statOriginalUrl = document.getElementById('stat-original-url');
const statShortCode = document.getElementById('stat-short-code');
const statExpiresAt = document.getElementById('stat-expires-at');
const statClicks = document.getElementById('stat-clicks');

const historyTable = document.getElementById('history-table');
const historyTableBody = document.getElementById('history-table-body');
const historyEmpty = document.getElementById('history-empty');
const toastContainer = document.getElementById('toast-container');

// ── Helper: Loading State ─────────────────────────────────

/**
 * Toggles the loading spinner and disables inputs.
 * @param {boolean} isLoading - Active state indicator.
 */
const toggleLoading = (isLoading) => {
  if (isLoading) {
    submitBtn.classList.add('btn--loading');
    submitBtn.disabled = true;
    urlInput.disabled = true;
    aliasInput.disabled = true;
  } else {
    submitBtn.classList.remove('btn--loading');
    submitBtn.disabled = false;
    urlInput.disabled = false;
    aliasInput.disabled = false;
  }
};

// ── Helper: Toast Notifications ───────────────────────────

/**
 * Displays a toast alert notification.
 * @param {string} message - Text message content.
 * @param {string} [type='success'] - Style configuration: 'success' | 'error'.
 */
const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  
  toast.innerHTML = `
    <span class="toast__content">${type === 'success' ? '✅' : '❌'} ${message}</span>
    <button class="toast__close" aria-label="Close notification">×</button>
  `;

  // Handle toast close trigger
  toast.querySelector('.toast__close').addEventListener('click', () => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  });

  toastContainer.appendChild(toast);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }
  }, 3000);
};

// ── Helper: Form Errors ───────────────────────────────────

/**
 * Sets visual validation error states.
 * @param {HTMLInputElement} inputEl - Target input element.
 * @param {HTMLSpanElement} errorEl - Target error text element.
 * @param {string} message - Validation message.
 */
const setInputError = (inputEl, errorEl, message) => {
  if (message) {
    inputEl.classList.add('error-shake');
    errorEl.textContent = message;
    errorEl.classList.add('visible');
    
    // Clear shake class after animation completes
    inputEl.addEventListener('animationend', () => {
      inputEl.classList.remove('error-shake');
    }, { once: true });
  } else {
    inputEl.classList.remove('error-shake');
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
};

// ── Core functions ────────────────────────────────────────

/**
 * Calls the API to fetch and render all previously shortened URLs.
 */
const loadAllUrls = async () => {
  try {
    const response = await fetch('/api/urls');
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to load history');
    }

    const urls = result.data || [];

    if (urls.length === 0) {
      historyTable.style.display = 'none';
      historyEmpty.style.display = 'flex';
      return;
    }

    historyTable.style.display = 'table';
    historyEmpty.style.display = 'none';
    historyTableBody.innerHTML = '';

    urls.forEach((url) => {
      const row = document.createElement('tr');
      
      const createdDate = new Date(url.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      row.innerHTML = `
        <td>
          <div class="history-table__long-url" title="${url.longUrl}">
            ${url.longUrl}
          </div>
        </td>
        <td>
          <a href="${url.shortUrl}" target="_blank" class="history-table__short-url">
            ${url.shortUrl.replace(/^https?:\/\//, '')}
          </a>
        </td>
        <td>
          <span class="history-table__clicks">${url.clicks}</span>
        </td>
        <td>
          <span>${createdDate}</span>
        </td>
        <td class="text-right">
          <button class="btn btn--outline btn--sm row-copy-btn" data-url="${url.shortUrl}">📋 Copy</button>
          <button class="btn btn--outline btn--sm row-delete-btn" data-code="${url.shortCode}" style="border-color: rgba(255,82,82,0.3); color: var(--error-color);">🗑️ Delete</button>
        </td>
      `;

      // Attach row action listeners
      row.querySelector('.row-copy-btn').addEventListener('click', (e) => {
        const btn = e.target;
        const targetUrl = btn.getAttribute('data-url');
        copyToClipboard(targetUrl, btn);
      });

      row.querySelector('.row-delete-btn').addEventListener('click', (e) => {
        const code = e.currentTarget.getAttribute('data-code');
        deleteUrl(code);
      });

      historyTableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error fetching URLs:', error);
    showToast('Failed to load URL history', 'error');
  }
};

/**
 * Submits the form data to shorten a URL.
 */
const shortenUrl = async (e) => {
  e.preventDefault();
  
  const longUrl = urlInput.value.trim();
  const customCode = aliasInput.value.trim();

  // Reset error states
  setInputError(urlInput, urlError, '');
  setInputError(aliasInput, aliasError, '');

  // Basic validation checks
  if (!longUrl) {
    setInputError(urlInput, urlError, 'Please enter a URL');
    return;
  }

  toggleLoading(true);

  try {
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ longUrl, customCode }),
    });

    const result = await response.json();

    if (!result.success) {
      // Map API warnings directly to fields where appropriate
      if (result.message.toLowerCase().includes('url')) {
        setInputError(urlInput, urlError, result.message);
      } else if (result.message.toLowerCase().includes('code')) {
        setInputError(aliasInput, aliasError, result.message);
      } else {
        showToast(result.message || 'An error occurred', 'error');
      }
      return;
    }

    const { data } = result;

    // Populates statistics and QR code card fields
    shortUrlDisplay.textContent = data.shortUrl;
    statOriginalUrl.textContent = data.longUrl;
    statOriginalUrl.title = data.longUrl;
    statShortCode.textContent = data.shortCode;
    statClicks.textContent = data.clicks;

    const expiryDate = new Date(data.expiresAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    statExpiresAt.textContent = expiryDate;

    // Render the QR code image
    qrImage.src = data.qrCode;
    downloadQrBtn.href = data.qrCode;

    // Render transitions and reset form focus
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: 'smooth' });
    shortenForm.reset();
    showToast('Short URL generated successfully!', 'success');

    // Reload history list
    await loadAllUrls();
  } catch (error) {
    console.error('Error shortening URL:', error);
    showToast('Something went wrong. Please try again.', 'error');
  } finally {
    toggleLoading(false);
  }
};

/**
 * Copies short link text to the operating system clipboard.
 * Updates copy button visual state for 2 seconds.
 * @param {string} text - URL text to write.
 * @param {HTMLButtonElement} buttonEl - Target copy button.
 */
const copyToClipboard = async (text, buttonEl) => {
  try {
    await navigator.clipboard.writeText(text);
    
    // Save original state details
    const originalText = buttonEl.innerHTML;
    buttonEl.innerHTML = '✅ Copied!';
    buttonEl.classList.add('btn--success');
    showToast('Link copied to clipboard', 'success');

    // Reset button display after delay
    setTimeout(() => {
      buttonEl.innerHTML = originalText;
      buttonEl.classList.remove('btn--success');
    }, 2000);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    showToast('Failed to copy to clipboard', 'error');
  }
};

/**
 * Deletes a shortened URL.
 * Prompts user for validation prior to deleting.
 * @param {string} shortCode - Code identifier to delete.
 */
const deleteUrl = async (shortCode) => {
  const confirmDelete = confirm('Are you sure you want to delete this short URL?');
  if (!confirmDelete) return;

  try {
    const response = await fetch(`/api/urls/${shortCode}`, {
      method: 'DELETE',
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Deletion failed');
    }

    showToast('Short URL deleted successfully', 'success');
    await loadAllUrls();

    // Hide result section if the deleted URL was currently showing
    if (statShortCode.textContent === shortCode) {
      resultSection.hidden = true;
    }
  } catch (error) {
    console.error('Error deleting URL:', error);
    showToast('Failed to delete URL', 'error');
  }
};

// ── Event Handlers & Initializer ────────────────────────────

// Form submission trigger
shortenForm.addEventListener('submit', shortenUrl);

// Reset form results view trigger
resetFormBtn.addEventListener('click', () => {
  resultSection.hidden = true;
  urlInput.focus();
});

// Primary result card copy trigger
copyBtn.addEventListener('click', () => {
  copyToClipboard(shortUrlDisplay.textContent, copyBtn);
});

// Bind manual Enter triggers for input fields (form submit happens automatically, but let's bind cleanly)
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    shortenUrl(e);
  }
});

// Load the dashboard on load
window.addEventListener('DOMContentLoaded', loadAllUrls);
