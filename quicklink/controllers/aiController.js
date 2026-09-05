/**
 * @file       aiController.js
 * @description Express controller handlers for AI Intelligence Suite capabilities.
 * @module     controllers/aiController
 */

'use strict';

const Url = require('../models/Url');
const Click = require('../models/Click');
const AiInsight = require('../models/AiInsight');
const AiConversation = require('../models/AiConversation');
const { scrapeUrlMetadata } = require('../utils/urlScraper');
const {
  analyzeUrlSafety,
  generateSmartAliasesAndTags,
  predictClickTrends,
  runCopilotChat,
  generateSmartUtm,
} = require('../utils/geminiService');
const { canAccessAiFeature } = require('../config/aiFeatures');

/**
 * 1. Smart Suggestions (Aliases, Category, Tags, Summary)
 * POST /api/ai/suggestions
 */
exports.getSmartSuggestions = async (req, res, next) => {
  try {
    const { longUrl } = req.body;
    if (!longUrl) {
      return res.status(400).json({ success: false, message: 'longUrl is required' });
    }

    const userPlan = req.user?.planId || 'free';
    if (!canAccessAiFeature(userPlan, 'autoTagging') && !canAccessAiFeature(userPlan, 'smartAliasLimitPerMonth')) {
      return res.status(403).json({
        success: false,
        message: 'Smart Alias Suggestions require Pro or Business plan upgrade.',
      });
    }

    const scraped = await scrapeUrlMetadata(longUrl);
    const aiData = await generateSmartAliasesAndTags(longUrl, scraped);

    // Filter out taken custom shortCodes from database
    const availableAliases = [];
    if (Array.isArray(aiData.aliases)) {
      for (const alias of aiData.aliases) {
        const cleanAlias = alias
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '')
          .replace(/^-+|-+$/g, '');

        if (cleanAlias.length > 2) {
          const existing = await Url.findOne({ shortCode: cleanAlias });
          if (!existing) {
            availableAliases.push(cleanAlias);
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        aliases: availableAliases,
        category: aiData.category || 'Other',
        tags: aiData.tags || [],
        summary: aiData.summary || scraped.title || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. URL Safety & Malware Check
 * POST /api/ai/safety-check
 */
exports.checkUrlSafety = async (req, res, next) => {
  try {
    const { longUrl } = req.body;
    if (!longUrl) {
      return res.status(400).json({ success: false, message: 'longUrl is required' });
    }

    const scraped = await scrapeUrlMetadata(longUrl);
    const safety = await analyzeUrlSafety(longUrl, scraped);

    res.status(200).json({
      success: true,
      data: {
        safetyScore: safety.safetyScore,
        isMalicious: safety.isMalicious,
        reason: safety.reason,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Click Predictions & Sharing Timing Insights
 * GET /api/ai/predictions/:shortCode
 */
exports.getUrlPredictions = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const urlDoc = await Url.findOne({ shortCode });
    if (!urlDoc) {
      return res.status(404).json({ success: false, message: 'Short URL not found' });
    }

    const userPlan = req.user?.planId || 'free';
    if (!canAccessAiFeature(userPlan, 'clickPrediction')) {
      return res.status(403).json({
        success: false,
        message: 'Predictive Analytics feature is available on Pro and Business plans.',
      });
    }

    const historicalClickCount = await Click.countDocuments({ urlId: urlDoc._id });
    const predictions = await predictClickTrends(urlDoc.longUrl, historicalClickCount, req.user?.industry || 'General');

    // Save or update AiInsight document
    let insight = await AiInsight.findOne({ urlId: urlDoc._id });
    if (!insight) {
      insight = new AiInsight({
        urlId: urlDoc._id,
        title: urlDoc.aiSummary || urlDoc.shortCode,
        category: urlDoc.aiCategory || 'Other',
        tags: urlDoc.aiTags || [],
        predictedClicksNext30Days: predictions.predictedClicksNext30Days,
        optimalPostingTimes: predictions.optimalPostingTimes,
      });
    } else {
      insight.predictedClicksNext30Days = predictions.predictedClicksNext30Days;
      insight.optimalPostingTimes = predictions.optimalPostingTimes;
      insight.analyzedAt = new Date();
    }
    await insight.save();

    res.status(200).json({
      success: true,
      data: {
        shortCode,
        historicalClicks: historicalClickCount,
        predictedClicksNext30Days: predictions.predictedClicksNext30Days,
        optimalPostingTimes: predictions.optimalPostingTimes,
        recommendations: predictions.recommendations || [],
        insight,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Smart Campaign UTM Builder
 * POST /api/ai/utm-builder
 */
exports.buildSmartUtm = async (req, res, next) => {
  try {
    const { longUrl, goal, channel } = req.body;
    if (!longUrl) {
      return res.status(400).json({ success: false, message: 'longUrl is required' });
    }

    const userPlan = req.user?.planId || 'free';
    if (!canAccessAiFeature(userPlan, 'smartUtmBuilder')) {
      return res.status(403).json({
        success: false,
        message: 'Smart UTM Builder is available on Pro and Business plans.',
      });
    }

    const utmResult = await generateSmartUtm(longUrl, goal, channel);

    res.status(200).json({
      success: true,
      data: utmResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Copilot Conversational Assistant
 * POST /api/ai/copilot
 */
exports.sendCopilotMessage = async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'message content is required' });
    }

    const userPlan = req.user?.planId || 'free';
    if (!canAccessAiFeature(userPlan, 'aiCopilot')) {
      return res.status(403).json({
        success: false,
        message: 'QuickLink AI Copilot is exclusively available on the Business plan.',
      });
    }

    // Fetch conversation or initialize new
    let conversation = null;
    if (conversationId) {
      conversation = await AiConversation.findOne({ _id: conversationId, userId: req.user._id });
    }

    if (!conversation) {
      conversation = new AiConversation({
        userId: req.user._id,
        title: message.slice(0, 30) + '...',
        messages: [],
      });
    }

    // Append user message
    conversation.messages.push({ role: 'user', content: message });

    // Gather user workspace metrics for AI context
    const totalUrls = await Url.countDocuments({ userId: req.user._id });
    const userUrls = await Url.find({ userId: req.user._id }).select('_id shortCode longUrl clicks').sort({ clicks: -1 }).limit(10).lean();
    const urlIds = userUrls.map((u) => u._id);
    const totalClicks = await Click.countDocuments({ urlId: { $in: urlIds } });

    const userContextData = {
      userPlan,
      totalUrls,
      totalClicks,
      topLinks: userUrls.map((u) => ({ shortCode: u.shortCode, longUrl: u.longUrl, clicks: u.clicks })),
    };

    // Run AI chat completion
    const aiReply = await runCopilotChat(conversation.messages, userContextData);

    // Append assistant response
    conversation.messages.push({ role: 'assistant', content: aiReply });
    await conversation.save();

    res.status(200).json({
      success: true,
      data: {
        conversationId: conversation._id,
        reply: aiReply,
        conversation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Get Copilot History
 * GET /api/ai/copilot/history
 */
exports.getCopilotHistory = async (req, res, next) => {
  try {
    const userPlan = req.user?.planId || 'free';
    if (!canAccessAiFeature(userPlan, 'aiCopilot')) {
      return res.status(403).json({
        success: false,
        message: 'QuickLink AI Copilot requires Business plan.',
      });
    }

    const conversations = await AiConversation.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        conversations,
      },
    });
  } catch (error) {
    next(error);
  }
};
