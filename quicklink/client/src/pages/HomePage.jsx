/**
 * @file       HomePage.jsx
 * @description QuickLink landing page. Serves shortening form interface,
 *              immediate results card, user history list, and value propositions.
 * @module     pages/HomePage
 * @requires   react
 * @requires   framer-motion
 * @requires   hooks/useUrls
 * @requires   components/url/UrlForm
 * @requires   components/url/UrlResult
 * @requires   components/url/UrlTable
 * @created    2026-08-12
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUrls } from '../hooks/useUrls';
import { useAuth } from '../hooks/useAuth';
import UrlForm from '../components/url/UrlForm';
import UrlResult from '../components/url/UrlResult';
import UrlTable from '../components/url/UrlTable';
import { Link } from 'react-router-dom';
import { FiZap, FiBarChart2, FiShield } from 'react-icons/fi';
import SEOHead from '../components/seo/SEOHead';

const HomePage = () => {
  const { urls, isLoading, shorten, remove } = useUrls();
  const { isAuthenticated } = useAuth();
  const [shortenedData, setShortenedData] = useState(null);

  const handleShortenSubmit = async (longUrl, customCode) => {
    try {
      const data = await shorten(longUrl, customCode);
      setShortenedData(data);
    } catch (err) {
      setShortenedData(null);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <>
      <SEOHead pageKey="home" />
      <motion.div
      className="page-wrapper"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      {/* Hero Header Section */}
      <motion.section className="hero-section" variants={itemVariants}>
        <div className="badge-promo">⚡ Premium URL Optimization</div>
        <h1 className="hero-title">
          Shorten Your URLs <span className="title-gradient">Instantly</span>
        </h1>
        <p className="hero-subtitle">
          Optimize, track, and brand your short links. Access advanced clicks analytics,
          downloadable QR codes, and custom aliases inside a single unified dashboard.
        </p>
      </motion.section>

      {/* Shortener Widget Section */}
      <motion.section className="shortener-section" variants={itemVariants}>
        <UrlForm onSubmit={handleShortenSubmit} isLoading={isLoading} />
        {shortenedData && <UrlResult urlData={shortenedData} />}
      </motion.section>

      {/* URL History Section */}
      <motion.section className="history-section" variants={itemVariants}>
        <div className="history-header">
          <h2>Your Short Links History</h2>
          {!isAuthenticated && (
            <span className="guest-login-tip">
              💡 <Link to="/login">Log in</Link> to save links permanently to your account.
            </span>
          )}
        </div>
        <UrlTable urls={urls} isLoading={isLoading} onDelete={remove} />
      </motion.section>

      {/* Features Promo Grid */}
      <motion.section className="features-section" variants={itemVariants}>
        <h2 className="section-title-center">Core Capabilities</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <FiZap />
            </div>
            <h3>Lightning Fast</h3>
            <p>Our redirection servers are optimized for sub-millisecond latencies, forwarding users instantly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ color: 'var(--secondary)' }}>
              <FiBarChart2 />
            </div>
            <h3>Click Analytics</h3>
            <p>Monitor geographics, web browsers, active devices, and traffic referrers in real-time logs.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ color: '#FFD93D' }}>
              <FiShield />
            </div>
            <h3>Secure & Expiring Links</h3>
            <p>Maintain data safety with automated 7-day TTL index cleanups and secure custom code validation rules.</p>
          </div>
        </div>
      </motion.section>

      <style>{`
        .hero-section {
          text-align: center;
          margin-bottom: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .badge-promo {
          background-color: var(--primary-light);
          color: var(--primary);
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
          border: 1px solid rgba(108, 99, 255, 0.3);
        }
        .hero-title {
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1.25;
          margin-bottom: 16px;
        }
        .title-gradient {
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          font-size: 1rem;
          color: var(--text-secondary);
          max-width: 650px;
          line-height: 1.6;
        }
        .shortener-section {
          margin-bottom: 60px;
        }
        .history-section {
          margin-bottom: 70px;
        }
        .history-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        .history-header h2 {
          font-size: 1.3rem;
          font-weight: 700;
        }
        .guest-login-tip {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .section-title-center {
          text-align: center;
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 30px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .feature-card {
          background: var(--bg-card);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-lg);
          padding: 30px;
          transition: var(--transition);
        }
        .feature-card:hover {
          transform: translateY(-5px);
          border-color: var(--primary);
        }
        .feature-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: var(--primary);
          margin-bottom: 16px;
        }
        .feature-card h3 {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .feature-card p {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: 3.2rem;
          }
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .history-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-end;
          }
        }
      `}</style>
    </motion.div>
    </>
  );
};

export default HomePage;
