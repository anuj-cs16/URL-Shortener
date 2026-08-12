/**
 * @file       Footer.jsx
 * @description Application footer layouts containing copyright labels and brand credits.
 * @module     components/layout/Footer
 * @created    2026-08-12
 */

import React from 'react';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <p className="footer-logo">🔗 QuickLink</p>
        <p className="footer-text">
          Made with ❤️ using React & Express. Optimize, generate, and track links instantly.
        </p>
        <p className="footer-copyright">
          © {new Date().getFullYear()} QuickLink. All rights reserved.
        </p>
      </div>

      <style>{`
        .footer-container {
          border-top: 1px solid var(--border);
          background: rgba(15, 15, 26, 0.5);
          width: 100%;
          padding: 30px 20px;
          margin-top: auto;
        }
        .footer-content {
          max-width: 960px;
          margin: 0 auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .footer-logo {
          font-weight: 800;
          font-size: 1.1rem;
          color: white;
        }
        .footer-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .footer-copyright {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </footer>
  );
};

export default Footer;
