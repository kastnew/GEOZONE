import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import Geozone1Frame from './components/legacy/Geozone1Frame.jsx';
import './index.css';

// Mặc định render ứng dụng React mới hoàn thiện.
// Truy cập ?legacy=true nếu muốn mở lại iframe nguyên khối ban đầu.
const useLegacy = new URLSearchParams(window.location.search).get('legacy') === 'true';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {useLegacy ? <Geozone1Frame /> : <App />}
  </React.StrictMode>
);
