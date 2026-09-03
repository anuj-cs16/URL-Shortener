/**
 * @file ThemeContext.js
 * @description Theme context provider. Always dark mode per design spec.
 */

import React, { createContext } from 'react';
import { COLORS, FONTS, SIZES, SPACING, SHADOWS, BORDER_RADIUS, GRADIENTS } from '../config/theme';

export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const theme = {
    dark: true,
    colors: COLORS,
    fonts: FONTS,
    sizes: SIZES,
    spacing: SPACING,
    shadows: SHADOWS,
    borderRadius: BORDER_RADIUS,
    gradients: GRADIENTS,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
