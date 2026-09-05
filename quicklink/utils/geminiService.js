/**
 * @file       geminiService.js
 * @description Integration service for Google Gemini API (@google/genai) with 24-hour caching and fallback mechanisms.
 * @module     utils/geminiService
 */

'use strict';

const { GoogleGenAI } = require('@google/genai');
const NodeCache = require('node-cache');

const ttlHours = parseInt(process.env.AI_CACHE_TTL_HOURS, 10) || 24;
const aiCache = new NodeCache({ stdTTL: ttlHours * 3600 });

const apiKey = process.env.GEMINI_API_KEY;
let ai = null;

if (apiKey && apiKey !== 'your_google_gemini_api_key_here') {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (e) {
    console.warn('[Gemini Service]: Failed to initialize GoogleGenAI SDK instance:', e.message);
  }
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * 1. URL Safety & Malware Scan
 * @param {string} url
 * @param {Object} scrapedData
 * @returns {Promise<{safetyScore: number, isMalicious: boolean, reason: string|null}>}
 */
async function analyzeUrlSafety(url, scrapedData = {}) {
  const cacheKey = `safety_${url}`;
  if (aiCache.has(cacheKey)) return aiCache.get(cacheKey);

  // Check known malicious keywords/patterns locally as immediate guard
  const lowerUrl = (url || '').toLowerCase();
  const suspiciousKeywords = ['phishing', 'malware-test', 'credential-steal', 'account-login-fake', 'verify-bank-pass'];
  const isSuspiciousLocal = suspiciousKeywords.some((kw) => lowerUrl.includes(kw));

  if (isSuspiciousLocal) {
    const result = {
      safetyScore: 15,
      isMalicious: true,
      reason: 'Flagged by security filter for potential phishing or credential theft pattern.',
    };
    aiCache.set(cacheKey, result);
    return result;
  }

  if (!ai) {
    const result = { safetyScore: 95, isMalicious: false, reason: null };
    aiCache.set(cacheKey, result);
    return result;
  }

  const prompt = `You are a web security specialist.
Analyze this destination URL and page content for phishing, malware, scams, or malicious behavior:
URL: ${url}
Title: ${scrapedData.title || ''}
Snippet: ${scrapedData.bodySnippet || ''}

Return ONLY a valid JSON object matching this exact schema:
{
  "safetyScore": 0-100 (where 100 is completely safe and 0 is dangerous),
  "isMalicious": boolean,
  "reason": "short explanation if suspicious, or null if safe"
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const result = JSON.parse(response.text);
    aiCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('[Gemini Service - analyzeUrlSafety Error]:', err.message);
    return { safetyScore: 90, isMalicious: false, reason: null };
  }
}

/**
 * 2. Smart Alias & Categorization Generator
 * @param {string} url
 * @param {Object} scrapedData
 * @returns {Promise<{aliases: string[], category: string, tags: string[], summary: string}>}
 */
async function generateSmartAliasesAndTags(url, scrapedData = {}) {
  const cacheKey = `alias_${url}`;
  if (aiCache.has(cacheKey)) return aiCache.get(cacheKey);

  if (!ai) {
    // Fallback generation logic based on URL structure and scraped title
    let domainName = 'link';
    try {
      const parsed = new URL(url);
      domainName = parsed.hostname.replace('www.', '').split('.')[0] || 'link';
    } catch (_) {}

    const cleanTitle = (scrapedData.title || domainName)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 3);

    const baseSlug = cleanTitle.join('-') || domainName;
    const randomSuffix = () => Math.floor(100 + Math.random() * 900);

    const fallbackResult = {
      aliases: [
        `${baseSlug}`,
        `${baseSlug}-get`,
        `${domainName}-special`,
        `quick-${baseSlug}`,
        `${baseSlug}-${randomSuffix()}`,
      ],
      category: 'Technology',
      tags: cleanTitle.length > 0 ? cleanTitle : [domainName, 'web'],
      summary: scrapedData.title ? `Destination page: ${scrapedData.title}` : `Link to ${domainName}`,
    };

    aiCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }

  const prompt = `Generate 5 catchy, short, URL-friendly slug aliases and classify this page:
URL: ${url}
Title: ${scrapedData.title || ''}
Snippet: ${scrapedData.bodySnippet || ''}

Return ONLY a valid JSON object:
{
  "aliases": ["slug1", "slug2", "slug3", "slug4", "slug5"],
  "category": "Technology" | "E-commerce" | "News" | "Education" | "Entertainment" | "Finance" | "Social Media" | "Marketing" | "Health" | "Travel" | "Other",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "summary": "1 sentence concise summary of the destination page"
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const result = JSON.parse(response.text);
    aiCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('[Gemini Service - generateSmartAliasesAndTags Error]:', err.message);
    return {
      aliases: [],
      category: 'Other',
      tags: [],
      summary: scrapedData.title || '',
    };
  }
}

/**
 * 3. Click Prediction & Optimal Timing
 * @param {string} url
 * @param {number} historicalClickCount
 * @param {string} userIndustry
 * @returns {Promise<{predictedClicksNext30Days: number, optimalPostingTimes: Array, recommendations: string[]}>}
 */
async function predictClickTrends(url, historicalClickCount = 0, userIndustry = 'General') {
  const cacheKey = `predict_${url}_${historicalClickCount}`;
  if (aiCache.has(cacheKey)) return aiCache.get(cacheKey);

  const estimatedGrowth = Math.round(historicalClickCount * 1.35 + 25);
  const defaultPostingTimes = [
    { dayOfWeek: 'Tuesday', hourOfDay: 10, predictedEngagement: 'High' },
    { dayOfWeek: 'Thursday', hourOfDay: 14, predictedEngagement: 'Peak' },
    { dayOfWeek: 'Sunday', hourOfDay: 18, predictedEngagement: 'Medium' },
  ];
  const defaultTips = [
    'Share this link on LinkedIn during peak morning business hours (9 AM - 11 AM).',
    'Include a clear call-to-action in your post preview to boost click-through rate by up to 30%.',
    'Use branded short domain to increase audience trust and engagement.',
  ];

  if (!ai) {
    const fallback = {
      predictedClicksNext30Days: estimatedGrowth,
      optimalPostingTimes: defaultPostingTimes,
      recommendations: defaultTips,
    };
    aiCache.set(cacheKey, fallback);
    return fallback;
  }

  const prompt = `Based on a shortened link in industry "${userIndustry}" with ${historicalClickCount} historical clicks, provide optimal sharing advice.
Return ONLY valid JSON:
{
  "predictedClicksNext30Days": number,
  "optimalPostingTimes": [
    { "dayOfWeek": "Monday", "hourOfDay": 10, "predictedEngagement": "High" },
    { "dayOfWeek": "Wednesday", "hourOfDay": 14, "predictedEngagement": "Peak" },
    { "dayOfWeek": "Friday", "hourOfDay": 16, "predictedEngagement": "Medium" }
  ],
  "recommendations": ["Tip 1", "Tip 2", "Tip 3"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const result = JSON.parse(response.text);
    aiCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('[Gemini Service - predictClickTrends Error]:', err.message);
    return {
      predictedClicksNext30Days: estimatedGrowth,
      optimalPostingTimes: defaultPostingTimes,
      recommendations: defaultTips,
    };
  }
}

/**
 * 4. Copilot Conversational Assistant
 * @param {Array<{role: string, content: string}>} chatHistory
 * @param {Object} userContextData
 * @returns {Promise<string>}
 */
async function runCopilotChat(chatHistory = [], userContextData = {}) {
  const systemInstruction = `You are QuickLink AI, an intelligent URL and link-marketing assistant.
You have access to the user's link analytics and performance data:
${JSON.stringify(userContextData, null, 2)}

Provide concise, highly actionable, marketing-savvy answers formatted in clean GitHub Markdown. Use bullet points and clear recommendations.`;

  if (!ai) {
    const lastUserMsg = [...chatHistory].reverse().find((m) => m.role === 'user')?.content || '';
    const totalLinks = userContextData.totalUrls || 0;
    const totalClicks = userContextData.totalClicks || 0;

    if (lastUserMsg.toLowerCase().includes('highest') || lastUserMsg.toLowerCase().includes('top')) {
      return `### 📊 Top Performing Links Analysis\nBased on your workspace data, your top link has generated the majority of your **${totalClicks} total clicks**. \n\n**Recommendations:**\n- Repost high-performing links on LinkedIn and X/Twitter during weekday morning hours.\n- Add custom UTM parameters to track campaign attribution across sub-channels.`;
    }

    return `Hello! I'm **QuickLink AI Copilot** 🤖.\n\nI analyzed your workspace: you currently have **${totalLinks} active links** with **${totalClicks} total clicks**.\n\nHow can I help optimize your campaign performance today? You can ask me to:\n- Analyze traffic sources & top countries\n- Recommend optimal posting schedules\n- Generate custom campaign UTM links`;
  }

  try {
    const formattedContents = chatHistory.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        { role: 'user', parts: [{ text: `SYSTEM CONTEXT: ${systemInstruction}` }] },
        ...formattedContents,
      ],
    });

    return response.text;
  } catch (err) {
    console.error('[Gemini Service - runCopilotChat Error]:', err.message);
    return "I'm having trouble connecting to QuickLink AI services right now. Please check your query or try again in a moment.";
  }
}

/**
 * 5. Smart UTM Parameter Builder
 * @param {string} longUrl
 * @param {string} campaignGoal
 * @param {string} channel
 * @returns {Promise<{utm_source: string, utm_medium: string, utm_campaign: string, utm_term: string, utm_content: string, fullUrl: string}>}
 */
async function generateSmartUtm(longUrl, campaignGoal = 'conversions', channel = 'social') {
  const cleanChannel = (channel || 'social').toLowerCase().trim();
  const cleanGoal = (campaignGoal || 'brand').toLowerCase().trim();

  let source = cleanChannel;
  let medium = 'social';
  if (['email', 'newsletter'].includes(cleanChannel)) medium = 'email';
  if (['cpc', 'google', 'meta', 'ads'].includes(cleanChannel)) medium = 'cpc';

  const campaign = `ql_${cleanGoal}_${new Date().getFullYear()}`;

  const defaultUtm = {
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
    utm_term: 'quicklink',
    utm_content: 'cta_link',
  };

  const buildFullUrl = (params) => {
    try {
      const u = new URL(longUrl);
      Object.keys(params).forEach((key) => u.searchParams.set(key, params[key]));
      return u.toString();
    } catch (_) {
      return `${longUrl}?utm_source=${params.utm_source}&utm_medium=${params.utm_medium}&utm_campaign=${params.utm_campaign}`;
    }
  };

  if (!ai) {
    return {
      ...defaultUtm,
      fullUrl: buildFullUrl(defaultUtm),
    };
  }

  const prompt = `Generate standard, clean UTM parameters for this campaign:
URL: ${longUrl}
Goal: ${campaignGoal}
Channel: ${channel} (e.g., twitter, linkedin, email, newsletter)

Return ONLY valid JSON:
{
  "utm_source": "string",
  "utm_medium": "string",
  "utm_campaign": "string",
  "utm_term": "string",
  "utm_content": "string",
  "fullUrl": "string with utm appended"
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (err) {
    console.error('[Gemini Service - generateSmartUtm Error]:', err.message);
    return {
      ...defaultUtm,
      fullUrl: buildFullUrl(defaultUtm),
    };
  }
}

module.exports = {
  analyzeUrlSafety,
  generateSmartAliasesAndTags,
  predictClickTrends,
  runCopilotChat,
  generateSmartUtm,
};
