/**
 * @file       index.js
 * @description Application entry point. Mounts the main React App component.
 * @module     index
 * @requires   react
 * @requires   react-dom
 * @requires   App
 * @created    2026-08-12
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
