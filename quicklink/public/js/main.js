/**
 * @file       main.js
 * @description Frontend script managing URL shortening, authentication views, password strength checks, and dashboard state management.
 * @module     public/js/main
 */

'use strict';

// ── GLOBAL APPLICATION STATE ──────────────────────────────
let currentUser = null;

// ── DOM Element Selectors ──────────────────────────────────
// Navigation Auth Elements
const navLoggedOut = document.getElementById('nav-logged-out');
const navLoggedIn = document.getElementById('nav-logged-in');
const navUsername = document.getElementById('nav-username');
const navLoginBtn = document.getElementById('nav-login-btn');
const navSignupBtn = document.getElementById('nav-signup-btn');
const navDashboardBtn = document.getElementById('nav-dashboard-btn');
const navLogoutBtn = document.getElementById('nav-logout-btn');
const navLogo = document.getElementById('nav-logo');

// Main Views Containers
const mainAppContent = document.getElementById('main-app-content');
const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');
const dashboardSection = document.getElementById('dashboard-section');

// URL Shortening Panel Elements
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

// History Table Elements
const historyTable = document.getElementById('history-table');
const historyTableBody = document.getElementById('history-table-body');
const historyEmpty = document.getElementById('history-empty');
const historyLoginPrompt = document.getElementById('history-login-prompt');
const historyLoginBtn = document.getElementById('history-login-btn');

// Login Form Elements
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginEmailError = document.getElementById('login-email-error');
const loginPasswordError = document.getElementById('login-password-error');
const loginPasswordToggle = document.getElementById('login-password-toggle');
const loginCancelBtn = document.getElementById('login-cancel-btn');
const goToSignup = document.getElementById('go-to-signup');

// Signup Form Elements
const signupForm = document.getElementById('signup-form');
const signupName = document.getElementById('signup-name');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupConfirmPassword = document.getElementById('signup-confirm-password');
const signupNameError = document.getElementById('signup-name-error');
const signupEmailError = document.getElementById('signup-email-error');
const signupPasswordError = document.getElementById('signup-password-error');
const signupConfirmPasswordError = document.getElementById('signup-confirm-password-error');
const signupPasswordToggle = document.getElementById('signup-password-toggle');
const signupPasswordBar = document.getElementById('password-strength-bar');
const signupCancelBtn = document.getElementById('signup-cancel-btn');
const goToLogin = document.getElementById('go-to-login');

// Dashboard Settings Elements
const dashWelcomeName = document.getElementById('dash-welcome-name');
const dashUrlsCount = document.getElementById('dash-urls-count');
const dashCreatedDate = document.getElementById('dash-created-date');
const profileForm = document.getElementById('profile-form');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profileNameError = document.getElementById('profile-name-error');
const profileEmailError = document.getElementById('profile-email-error');
const passwordForm = document.getElementById('password-form');
const passwordCurrent = document.getElementById('password-current');
const passwordNew = document.getElementById('password-new');
const passwordCurrentError = document.getElementById('password-current-error');
const passwordNewError = document.getElementById('password-new-error');
const dashboardBackBtn = document.getElementById('dashboard-back-btn');

// Notifications Container
const toastContainer = document.getElementById('toast-container');

// ── Helper: Loading State ─────────────────────────────────

/**
 * Toggles loading spinners on buttons and disables input fields.
 * @param {HTMLButtonElement} btn - The target button.
 * @param {boolean} isLoading - Active state indicator.
 * @param {string} originalText - The original text to restore.
 */
const toggleBtnLoading = (btn, isLoading, originalText) => {
  if (isLoading) {
    btn.classList.add('btn--loading');
    btn.disabled = true;
    const textEl = btn.querySelector('.btn__text');
    if (textEl) textEl.textContent = 'Processing...';
  } else {
    btn.classList.remove('btn--loading');
    btn.disabled = false;
    const textEl = btn.querySelector('.btn__text');
    if (textEl) textEl.textContent = originalText;
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

  // Close trigger listener
  toast.querySelector('.toast__close').addEventListener('click', () => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  });

  toastContainer.appendChild(toast);

  // Auto-dismiss after 3s
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }
  }, 3000);
};

// ── Helper: Form Errors ───────────────────────────────────

/**
 * Sets visual validation error states on fields.
 * @param {HTMLInputElement} inputEl - Target input element.
 * @param {HTMLSpanElement} errorEl - Target error text element.
 * @param {string} message - Validation message.
 */
const setInputError = (inputEl, errorEl, message) => {
  if (message) {
    inputEl.classList.add('error-shake');
    errorEl.textContent = message;
    errorEl.classList.add('visible');
    
    inputEl.addEventListener('animationend', () => {
      inputEl.classList.remove('error-shake');
    }, { once: true });
  } else {
    inputEl.classList.remove('error-shake');
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
};

// ── AUTHENTICATION LAYOUT NAVIGATION ─────────────────────

/**
 * Hides all auth panels and shows the main shortener dashboard.
 */
const hideAuthPage = () => {
  loginSection.hidden = true;
  signupSection.hidden = true;
  dashboardSection.hidden = true;
  mainAppContent.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Renders the chosen authentication panel and hides home content.
 * @param {string} page - The target page: 'login' | 'signup' | 'dashboard'.
 */
const showAuthPage = (page) => {
  mainAppContent.hidden = true;
  loginSection.hidden = page !== 'login';
  signupSection.hidden = page !== 'signup';
  dashboardSection.hidden = page !== 'dashboard';
  
  // Clear any validation messages
  setInputError(loginEmail, loginEmailError, '');
  setInputError(loginPassword, loginPasswordError, '');
  setInputError(signupName, signupNameError, '');
  setInputError(signupEmail, signupEmailError, '');
  setInputError(signupPassword, signupPasswordError, '');
  setInputError(signupConfirmPassword, signupConfirmPasswordError, '');

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── PASSWORD STRENGTH INDICATOR ──────────────────────────

/**
 * Calculates password security level and updates color bars.
 * @param {string} password - The plain text string.
 */
const updatePasswordStrength = (password) => {
  // Clear if empty
  if (!password) {
    signupPasswordBar.className = 'password-strength-bar';
    return;
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  signupPasswordBar.className = 'password-strength-bar';

  if (score <= 1) {
    signupPasswordBar.classList.add('password-strength-bar--weak');
  } else if (score === 2 || score === 3) {
    signupPasswordBar.classList.add('password-strength-bar--medium');
  } else if (score >= 4) {
    signupPasswordBar.classList.add('password-strength-bar--strong');
  }
};

// ── NAVBAR UPDATE LOGIC ───────────────────────────────────

/**
 * Renders correct buttons in navbar and table headers depending on session states.
 * @param {Object|null} user - The logged-in user profile or null.
 */
const updateNavbar = (user) => {
  if (user) {
    navLoggedOut.style.display = 'none';
    navLoggedIn.style.display = 'flex';
    navUsername.textContent = `👤 ${user.name}`;
    historyLoginPrompt.style.display = 'none';
    
    // Prep dashboard fields
    dashWelcomeName.textContent = user.name;
    dashUrlsCount.textContent = user.totalUrlsCreated || 0;
    
    const memberDate = new Date(user.createdAt).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    dashCreatedDate.textContent = memberDate;

    profileName.value = user.name;
    profileEmail.value = user.email;
  } else {
    navLoggedOut.style.display = 'flex';
    navLoggedIn.style.display = 'none';
    navUsername.textContent = '';
    historyTable.style.display = 'none';
    historyEmpty.style.display = 'none';
    historyLoginPrompt.style.display = 'flex';
  }
};

// ── API HANDLERS: USER SESSIONS ──────────────────────────

/**
 * Validates authentication session cookies on startup.
 */
const checkAuthStatus = async () => {
  try {
    const response = await fetch('/api/auth/me');
    const result = await response.json();

    if (result.success && result.data && result.data.user) {
      currentUser = result.data.user;
      updateNavbar(currentUser);
      await loadAllUrls();
    } else {
      currentUser = null;
      updateNavbar(null);
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    currentUser = null;
    updateNavbar(null);
  }
};

/**
 * Authenticates user credentials.
 */
const handleLogin = async (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  setInputError(loginEmail, loginEmailError, '');
  setInputError(loginPassword, loginPasswordError, '');

  if (!email) {
    setInputError(loginEmail, loginEmailError, 'Please enter your email');
    return;
  }
  if (!password) {
    setInputError(loginPassword, loginPasswordError, 'Please enter your password');
    return;
  }

  const submitButton = document.getElementById('login-submit-btn');
  toggleBtnLoading(submitButton, true, 'Login');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!result.success) {
      showToast(result.message || 'Invalid email or password', 'error');
      return;
    }

    currentUser = result.data.user;
    updateNavbar(currentUser);
    showToast('Welcome back to QuickLink!', 'success');
    hideAuthPage();
    loginForm.reset();
    await loadAllUrls();
  } catch (error) {
    console.error('Login error:', error);
    showToast('Failed to connect to server', 'error');
  } finally {
    toggleBtnLoading(submitButton, false, 'Login');
  }
};

/**
 * Registers a new account.
 */
const handleRegister = async (e) => {
  e.preventDefault();
  const name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value;
  const confirmPassword = signupConfirmPassword.value;

  setInputError(signupName, signupNameError, '');
  setInputError(signupEmail, signupEmailError, '');
  setInputError(signupPassword, signupPasswordError, '');
  setInputError(signupConfirmPassword, signupConfirmPasswordError, '');

  if (!name) {
    setInputError(signupName, signupNameError, 'Please enter your name');
    return;
  }
  if (!email) {
    setInputError(signupEmail, signupEmailError, 'Please enter your email');
    return;
  }
  if (!password || password.length < 8) {
    setInputError(signupPassword, signupPasswordError, 'Password must be at least 8 characters');
    return;
  }
  if (password !== confirmPassword) {
    setInputError(signupConfirmPassword, signupConfirmPasswordError, 'Passwords do not match');
    return;
  }

  const submitButton = document.getElementById('signup-submit-btn');
  toggleBtnLoading(submitButton, true, 'Sign Up');

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const result = await response.json();

    if (!result.success) {
      showToast(result.message || 'Registration failed', 'error');
      return;
    }

    currentUser = result.data.user;
    updateNavbar(currentUser);
    showToast('Account created successfully!', 'success');
    hideAuthPage();
    signupForm.reset();
    signupPasswordBar.className = 'password-strength-bar';
    await loadAllUrls();
  } catch (error) {
    console.error('Registration error:', error);
    showToast('Failed to connect to server', 'error');
  } finally {
    toggleBtnLoading(submitButton, false, 'Sign Up');
  }
};

/**
 * Invalidates and clears user sessions.
 */
const handleLogout = async () => {
  try {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    const result = await response.json();

    if (result.success) {
      currentUser = null;
      updateNavbar(null);
      historyTableBody.innerHTML = '';
      resultSection.hidden = true;
      showToast('Logged out successfully', 'success');
      hideAuthPage();
    } else {
      showToast('Failed to logout', 'error');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Failed to connect to server', 'error');
  }
};

/**
 * Updates profile credentials.
 */
const handleUpdateProfile = async (e) => {
  e.preventDefault();
  const name = profileName.value.trim();
  const email = profileEmail.value.trim();

  setInputError(profileName, profileNameError, '');
  setInputError(profileEmail, profileEmailError, '');

  if (!name) {
    setInputError(profileName, profileNameError, 'Name is required');
    return;
  }
  if (!email) {
    setInputError(profileEmail, profileEmailError, 'Email is required');
    return;
  }

  const submitBtn = document.getElementById('profile-submit-btn');
  toggleBtnLoading(submitBtn, true, 'Save Profile');

  try {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });

    const result = await response.json();

    if (!result.success) {
      showToast(result.message || 'Profile update failed', 'error');
      return;
    }

    currentUser = result.data.user;
    updateNavbar(currentUser);
    showToast('Profile updated successfully!', 'success');
  } catch (error) {
    console.error('Profile update error:', error);
    showToast('Failed to connect to server', 'error');
  } finally {
    toggleBtnLoading(submitBtn, false, 'Save Profile');
  }
};

/**
 * Changes password credentials.
 */
const handleUpdatePassword = async (e) => {
  e.preventDefault();
  const currentPassword = passwordCurrent.value;
  const newPassword = passwordNew.value;

  setInputError(passwordCurrent, passwordCurrentError, '');
  setInputError(passwordNew, passwordNewError, '');

  if (!currentPassword) {
    setInputError(passwordCurrent, passwordCurrentError, 'Current password is required');
    return;
  }
  if (!newPassword || newPassword.length < 8) {
    setInputError(passwordNew, passwordNewError, 'New password must be at least 8 characters');
    return;
  }

  const submitBtn = document.getElementById('password-submit-btn');
  toggleBtnLoading(submitBtn, true, 'Update Password');

  try {
    const response = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const result = await response.json();

    if (!result.success) {
      showToast(result.message || 'Password update failed', 'error');
      return;
    }

    showToast('Password updated successfully!', 'success');
    passwordForm.reset();
  } catch (error) {
    console.error('Password change error:', error);
    showToast('Failed to connect to server', 'error');
  } finally {
    toggleBtnLoading(submitBtn, false, 'Update Password');
  }
};

// ── API HANDLERS: URL SHORTENING ──────────────────────────

/**
 * Calls the API to fetch and render the user's history list.
 */
const loadAllUrls = async () => {
  // If guest, show login prompt and block fetch
  if (!currentUser) {
    updateNavbar(null);
    return;
  }

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
          <div style="display: flex; align-items: center; gap: 8px;">
            <a href="${url.shortUrl}" target="_blank" class="history-table__short-url">
              ${url.shortUrl.replace(/^https?:\/\//, '')}
            </a>
            <button class="btn btn--outline btn--sm row-copy-btn" data-url="${url.shortUrl}" style="height: 28px; padding: 0 8px; font-size: 0.7rem; min-width: auto;" aria-label="Copy short URL">📋</button>
          </div>
        </td>
        <td>
          <span class="history-table__clicks">${url.clicks}</span>
        </td>
        <td>
          <span>${createdDate}</span>
        </td>
        <td>
          <a href="url-analytics.html?code=${url.shortCode}" class="btn btn--outline btn--sm" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; height: 34px; width: 90px;">📊 Stats</a>
        </td>
        <td class="text-right">
          <button class="btn btn--outline btn--sm row-delete-btn" data-code="${url.shortCode}" style="border-color: rgba(255,82,82,0.3); color: var(--error-color);">🗑️ Delete</button>
        </td>
      `;

      // Copy listener
      row.querySelector('.row-copy-btn').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const targetUrl = btn.getAttribute('data-url');
        copyToClipboard(targetUrl, btn);
      });

      // Delete listener
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

  setInputError(urlInput, urlError, '');
  setInputError(aliasInput, aliasError, '');

  if (!longUrl) {
    setInputError(urlInput, urlError, 'Please enter a URL');
    return;
  }

  // Visual submit loading status
  toggleBtnLoading(submitBtn, true, 'Shorten URL');

  try {
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ longUrl, customCode }),
    });

    const result = await response.json();

    if (!result.success) {
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

    // Populates result card
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

    qrImage.src = data.qrCode;
    downloadQrBtn.href = data.qrCode;

    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: 'smooth' });
    shortenForm.reset();
    showToast('Short URL generated successfully!', 'success');

    // Update table list
    await loadAllUrls();
  } catch (error) {
    console.error('Error shortening URL:', error);
    showToast('Something went wrong. Please try again.', 'error');
  } finally {
    toggleBtnLoading(submitBtn, false, 'Shorten URL');
  }
};

/**
 * Copies short link text to clipboard.
 * @param {string} text - URL text.
 * @param {HTMLButtonElement} buttonEl - Copy button trigger.
 */
const copyToClipboard = async (text, buttonEl) => {
  try {
    await navigator.clipboard.writeText(text);
    
    const originalText = buttonEl.innerHTML;
    buttonEl.innerHTML = '✅ Copied!';
    buttonEl.classList.add('btn--success');
    showToast('Link copied to clipboard', 'success');

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
 * Deletes a shortened URL from database.
 * @param {string} shortCode - Code to delete.
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

    if (statShortCode.textContent === shortCode) {
      resultSection.hidden = true;
    }
  } catch (error) {
    console.error('Error deleting URL:', error);
    showToast('Failed to delete URL', 'error');
  }
};

// ── BIND EVENT LISTENERS & INITS ───────────────────────────

// Shortener Form submission
shortenForm.addEventListener('submit', shortenUrl);

// Reset form results view trigger
resetFormBtn.addEventListener('click', () => {
  resultSection.hidden = true;
  urlInput.focus();
});

// Primary result card copy
copyBtn.addEventListener('click', () => {
  copyToClipboard(shortUrlDisplay.textContent, copyBtn);
});

// Manual Enter triggers
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    shortenUrl(e);
  }
});

// Navbar view toggles
navLoginBtn.addEventListener('click', () => showAuthPage('login'));
navSignupBtn.addEventListener('click', () => showAuthPage('signup'));
navDashboardBtn.addEventListener('click', () => showAuthPage('dashboard'));
navLogoutBtn.addEventListener('click', handleLogout);
historyLoginBtn.addEventListener('click', () => showAuthPage('login'));
navLogo.addEventListener('click', (e) => {
  e.preventDefault();
  hideAuthPage();
});

// Cancel & Go-to toggles
loginCancelBtn.addEventListener('click', hideAuthPage);
signupCancelBtn.addEventListener('click', hideAuthPage);
dashboardBackBtn.addEventListener('click', hideAuthPage);
goToSignup.addEventListener('click', (e) => {
  e.preventDefault();
  showAuthPage('signup');
});
goToLogin.addEventListener('click', (e) => {
  e.preventDefault();
  showAuthPage('login');
});

// Password visibility toggles
loginPasswordToggle.addEventListener('click', () => {
  const isPass = loginPassword.type === 'password';
  loginPassword.type = isPass ? 'text' : 'password';
  loginPasswordToggle.textContent = isPass ? '🔒' : '👁️';
});

signupPasswordToggle.addEventListener('click', () => {
  const isPass = signupPassword.type === 'password';
  signupPassword.type = isPass ? 'text' : 'password';
  signupPasswordToggle.textContent = isPass ? '🔒' : '👁️';
});

// Password strength indicator updates
signupPassword.addEventListener('input', (e) => {
  updatePasswordStrength(e.target.value);
});

// Auth form submissions
loginForm.addEventListener('submit', handleLogin);
signupForm.addEventListener('submit', handleRegister);
profileForm.addEventListener('submit', handleUpdateProfile);
passwordForm.addEventListener('submit', handleUpdatePassword);

// Initialize application status on startup
window.addEventListener('DOMContentLoaded', checkAuthStatus);
