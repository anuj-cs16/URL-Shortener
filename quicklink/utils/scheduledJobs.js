/**
 * @file       scheduledJobs.js
 * @description Configures node-cron intervals for processing URL expiries,
 *              milestones validation, warning notifications, and weekly reports.
 * @module     utils/scheduledJobs
 * @requires   node-cron
 * @requires   models/Url
 * @requires   models/Click
 * @requires   models/User
 * @requires   models/Notification
 * @requires   models/EmailSettings
 * @requires   utils/emailService
 * @created    2026-08-12
 */

'use strict';

const cron = require('node-cron');
const Url = require('../models/Url');
const Click = require('../models/Click');
const User = require('../models/User');
const Notification = require('../models/Notification');
const EmailSettings = require('../models/EmailSettings');
const emailService = require('./emailService');

/**
 * JOB 1: Weekly Report Email
 * Cron schedule: Every Monday at 9:00 AM (0 9 * * 1)
 */
const startWeeklyReportJob = () => {
  const schedule = process.env.WEEKLY_REPORT_CRON || '0 9 * * 1';
  cron.schedule(schedule, async () => {
    console.log('[Cron Job]: Starting weekly report generation process...');
    try {
      // Find all users with weeklyReport enabled
      const enabledSettings = await EmailSettings.find({ weeklyReport: true });
      let sentCount = 0;

      for (const settings of enabledSettings) {
        const user = await User.findById(settings.userId);
        if (!user) continue;

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Fetch URL metrics
        const totalUrls = await Url.countDocuments({ userId: user._id });
        const newUrlsThisWeek = await Url.countDocuments({
          userId: user._id,
          createdAt: { $gte: oneWeekAgo },
        });

        // Fetch click counts
        const urls = await Url.find({ userId: user._id }, '_id shortCode clicks');
        const urlIds = urls.map((u) => u._id);

        const clicksThisWeek = await Click.countDocuments({
          urlId: { $in: urlIds },
          clickedAt: { $gte: oneWeekAgo },
        });

        const totalClicks = urls.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

        // Find top URL for user in last 7 days
        const topUrlAggregation = await Click.aggregate([
          {
            $match: {
              urlId: { $in: urlIds },
              clickedAt: { $gte: oneWeekAgo },
            },
          },
          {
            $group: {
              _id: '$shortCode',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ]);

        let topUrl = '';
        let topUrlClicks = 0;
        if (topUrlAggregation.length > 0) {
          const appUrl = process.env.BASE_URL || 'http://localhost:5000';
          topUrl = `${appUrl}/${topUrlAggregation[0]._id}`;
          topUrlClicks = topUrlAggregation[0].count;
        }

        // Top country
        const topCountryAggregation = await Click.aggregate([
          {
            $match: {
              urlId: { $in: urlIds },
              clickedAt: { $gte: oneWeekAgo },
              country: { $ne: 'Unknown' },
            },
          },
          {
            $group: {
              _id: '$country',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ]);
        const topCountry = topCountryAggregation.length > 0 ? topCountryAggregation[0]._id : 'Unknown';

        // Device breakdown (percentages)
        const deviceAggregation = await Click.aggregate([
          {
            $match: {
              urlId: { $in: urlIds },
              clickedAt: { $gte: oneWeekAgo },
            },
          },
          {
            $group: {
              _id: '$deviceType',
              count: { $sum: 1 },
            },
          },
        ]);

        const deviceBreakdown = {};
        if (clicksThisWeek > 0) {
          deviceAggregation.forEach((item) => {
            const label = item._id || 'unknown';
            deviceBreakdown[label] = Math.round((item.count / clicksThisWeek) * 100);
          });
        }

        const weekStart = oneWeekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const weekEnd = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const reportData = {
          weekStart,
          weekEnd,
          totalUrls,
          totalClicks,
          newUrlsThisWeek,
          newClicksThisWeek: clicksThisWeek,
          topUrl,
          topUrlClicks,
          deviceBreakdown,
          topCountry,
        };

        // Send Email
        const emailSent = await emailService.sendWeeklyReportEmail(user, reportData);

        // Create Database Notification
        await Notification.create({
          userId: user._id,
          type: 'weekly_report',
          title: 'Weekly Analytics Report 📊',
          message: `Your report for the week of ${weekStart} - ${weekEnd} is ready. You received ${clicksThisWeek} clicks.`,
          isEmailSent: emailSent,
          emailSentAt: emailSent ? new Date() : null,
          metadata: reportData,
        });

        sentCount++;
      }

      console.log(`[Cron Job]: Successfully dispatched weekly reports to ${sentCount} users.`);
    } catch (error) {
      console.error(`[Cron Job Error]: Weekly report execution failed: ${error.message}`);
    }
  });
};

/**
 * JOB 2: URL Expiry Warning (24 hours check)
 * Cron schedule: Every hour (0 * * * *)
 */
const startExpiryWarningJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron Job]: Checking for links expiring in the next 24 hours...');
    try {
      const now = new Date();
      const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Find active URLs expiring in the next 24 hours that haven't received a warning yet
      const warningUrls = await Url.find({
        expiresAt: { $gt: now, $lte: twentyFourHoursFromNow },
        isActive: true,
        userId: { $ne: null },
        expireWarningSent: false,
      });

      let warningCount = 0;

      for (const url of warningUrls) {
        const user = await User.findById(url.userId);
        if (!user) continue;

        const hoursLeft = Math.max(1, Math.round((new Date(url.expiresAt) - new Date()) / (1000 * 60 * 60)));

        // Send Email
        const emailSent = await emailService.sendUrlExpiringEmail(user, url, hoursLeft);

        // Create Database Notification
        await Notification.create({
          userId: user._id,
          type: 'url_expiring',
          title: 'Short Link Expiring Soon ⚠️',
          message: `Your link for code ${url.shortCode} expires in ${hoursLeft} hours.`,
          isEmailSent: emailSent,
          emailSentAt: emailSent ? new Date() : null,
          metadata: {
            shortCode: url.shortCode,
            expiresAt: url.expiresAt,
            hoursLeft,
          },
        });

        // Set warning sent flag
        url.expireWarningSent = true;
        await url.save();
        warningCount++;
      }

      console.log(`[Cron Job]: Sent 24-hour warnings for ${warningCount} expiring URLs.`);
    } catch (error) {
      console.error(`[Cron Job Error]: Expiry warning execution failed: ${error.message}`);
    }
  });
};

/**
 * JOB 3: URL Expiry Processor
 * Cron schedule: Every hour (30 * * * *)
 */
const startExpiryProcessorJob = () => {
  cron.schedule('30 * * * *', async () => {
    console.log('[Cron Job]: Processing expired URLs...');
    try {
      const now = new Date();

      // Find active URLs that are past their expiry date
      const expiredUrls = await Url.find({
        expiresAt: { $lte: now },
        isActive: true,
      });

      let expiredCount = 0;

      for (const url of expiredUrls) {
        url.isActive = false;
        await url.save();

        if (url.userId) {
          const user = await User.findById(url.userId);
          if (user) {
            // Send Email
            const emailSent = await emailService.sendUrlExpiredEmail(user, url);

            // Create Database Notification
            await Notification.create({
              userId: user._id,
              type: 'url_expired',
              title: 'Short Link Expired 🕐',
              message: `Your link for code ${url.shortCode} has expired and is now inactive.`,
              isEmailSent: emailSent,
              emailSentAt: emailSent ? new Date() : null,
              metadata: {
                shortCode: url.shortCode,
                clicks: url.clicks,
                expiredAt: url.expiresAt,
              },
            });
          }
        }
        expiredCount++;
      }

      console.log(`[Cron Job]: Set ${expiredCount} expired URLs to inactive.`);
    } catch (error) {
      console.error(`[Cron Job Error]: Expiry processor execution failed: ${error.message}`);
    }
  });
};

/**
 * JOB 4: Click Milestone Checker
 * Cron schedule: Every 30 minutes (* / 30 * * * *)
 */
const startMilestoneJob = () => {
  cron.schedule('*/30 * * * *', async () => {
    console.log('[Cron Job]: Checking for click milestones...');
    try {
      // Find URLs where clicks reached typical milestone numbers but not registered as reached
      const activeUrls = await Url.find({
        userId: { $ne: null },
        isActive: true,
        clicks: { $gte: 10 },
      });

      // Default milestones list
      const allMilestones = [10, 50, 100, 500, 1000, 5000];
      let milestoneCount = 0;

      for (const url of activeUrls) {
        const user = await User.findById(url.userId);
        if (!user) continue;

        // Load custom settings if any
        let userMilestones = allMilestones;
        try {
          const settings = await EmailSettings.findOne({ userId: user._id });
          if (settings && settings.milestoneValues && settings.milestoneValues.length > 0) {
            userMilestones = settings.milestoneValues;
          }
        } catch (e) { /* fallback */ }

        // Find the highest milestone reached that hasn't been flagged yet
        const reachedMilestone = userMilestones
          .filter((m) => url.clicks >= m && !url.milestonesReached.includes(m))
          .sort((a, b) => b - a)[0]; // get highest

        if (reachedMilestone) {
          // Send Email
          const emailSent = await emailService.sendClickMilestoneEmail(user, url, reachedMilestone);

          // Create Database Notification
          await Notification.create({
            userId: user._id,
            type: 'click_milestone',
            title: 'Popularity Milestone Reached! 🎉',
            message: `Your link for code ${url.shortCode} reached ${reachedMilestone} clicks!`,
            isEmailSent: emailSent,
            emailSentAt: emailSent ? new Date() : null,
            metadata: {
              shortCode: url.shortCode,
              clicks: url.clicks,
              milestone: reachedMilestone,
            },
          });

          // Add to model milestonesReached array
          url.milestonesReached.push(reachedMilestone);
          await url.save();
          milestoneCount++;
        }
      }

      console.log(`[Cron Job]: Checked milestones, sent ${milestoneCount} alerts.`);
    } catch (error) {
      console.error(`[Cron Job Error]: Milestone checker execution failed: ${error.message}`);
    }
  });
};

/**
 * JOB 5: Clear Expired Blocked IPs
 * Cron schedule: Every 5 minutes (*/5 * * * *)
 */
const startClearExpiredBlockedIpsJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Cron Job]: Clearing expired blocked IP addresses...');
    try {
      const BlockedIp = require('../models/BlockedIp');
      const result = await BlockedIp.deleteMany({
        isPermanent: false,
        expiresAt: { $lt: new Date() },
      });
      if (result.deletedCount > 0) {
        console.log(`[Cron Job]: Cleared ${result.deletedCount} expired blocked IP address(es).`);
      }
    } catch (error) {
      console.error(`[Cron Job Error]: Blocked IP cleaner failed: ${error.message}`);
    }
  });
};

/**
 * JOB 6: Daily Database Cleanup
 * Cron schedule: Every day at midnight (0 0 * * *)
 */
const startDatabaseCleanupJob = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron Job]: Starting database cleanup process...');
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await Url.deleteMany({
        expiresAt: { $lt: thirtyDaysAgo }
      });
      console.log(`[Cron Job]: Database cleanup complete. Purged ${result.deletedCount} URLs expired > 30 days.`);
    } catch (error) {
      console.error(`[Cron Job Error]: Database cleanup failed: ${error.message}`);
    }
  });
};

/**
 * Initializes and triggers scheduled node-cron tasks.
 */
const initScheduledJobs = () => {
  if (process.env.NODE_ENV === 'test') {
    console.log('[Cron Job]: Scheduled tasks disabled in test environment.');
    return;
  }
  startWeeklyReportJob();
  startExpiryWarningJob();
  startExpiryProcessorJob();
  startMilestoneJob();
  startClearExpiredBlockedIpsJob();
  startDatabaseCleanupJob();
  console.log('✅ Cron Jobs initialized successfully');
};

module.exports = {
  initScheduledJobs,
};
