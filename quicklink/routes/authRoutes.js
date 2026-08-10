/**
 * @file       authRoutes.js
 * @description Route mapping for authentication endpoints. Applies guest/authenticated middlewares.
 * @module     routes/authRoutes
 * @requires   express
 * @requires   controllers/authController
 * @requires   middleware/auth
 */

'use strict';

const express = require('express');
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');

const { isAuthenticated, isGuest } = require('../middleware/auth');

// POST /api/auth/register - Register account (restricted to guests)
router.post('/register', isGuest, register);

// POST /api/auth/login - User login (restricted to guests)
router.post('/login', isGuest, login);

// POST /api/auth/logout - User logout (restricted to authenticated users)
router.post('/logout', isAuthenticated, logout);

// GET /api/auth/me - Get current user profile (restricted to authenticated users)
router.get('/me', isAuthenticated, getMe);

// PUT /api/auth/profile - Update user profile (restricted to authenticated users)
router.put('/profile', isAuthenticated, updateProfile);

// PUT /api/auth/password - Update password (restricted to authenticated users)
router.put('/password', isAuthenticated, changePassword);

module.exports = router;
