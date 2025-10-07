import React from 'react';
import ReactDOM from 'react-dom/client';
import TestApp from './src/TestApp';

// Test environment entry point
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
);
