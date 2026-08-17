import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getPageMeta, getWebSiteSchema, getWebAppSchema } from '../../utils/seoHelper';

/**
 * Reusable SEO Header component that handles document meta updates using react-helmet-async.
 * Injects Open Graph, Twitter Cards, Canonical links, and structured JSON-LD schemas.
 * 
 * @component
 * @param {Object} props
 * @param {string} props.pageKey - Key indicating which static page configuration to use.
 * @param {string} [props.customTitle] - Overriding custom document title.
 * @param {string} [props.customDescription] - Overriding custom meta description.
 * @param {string} [props.customKeywords] - Overriding custom meta keywords.
 */
const SEOHead = ({ pageKey, customTitle, customDescription, customKeywords }) => {
  const meta = getPageMeta(pageKey);
  const title = customTitle || meta.title;
  const description = customDescription || meta.description;
  const keywords = customKeywords || meta.keywords;
  const canonicalUrl = window.location.href;

  const websiteSchema = getWebSiteSchema();
  const webappSchema = getWebAppSchema();

  return (
    <Helmet>
      {/* Primary HTML Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${window.location.origin}/logo192.png`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${window.location.origin}/logo192.png`} />

      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(webappSchema)}
      </script>
    </Helmet>
  );
};

export default SEOHead;
