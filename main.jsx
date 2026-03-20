// ============================================================
// VokaOrbit — main.jsx
// Entry Point. ThemeProvider ist bereits in App.jsx gewrappt.
// ============================================================

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
