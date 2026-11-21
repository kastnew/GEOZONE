import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import Geozone1Frame from './components/legacy/Geozone1Frame.jsx';
import './index.css';

// Mặc định hiện giao diện GeoZone (geozone1). Thêm ?app=react vào URL
// (vd http://localhost:3000/?app=react) để xem lại giao diện React gốc.
const useReactApp = new URLSearchParams(window.location.search).get('app') === 'react';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{useReactApp ? <App /> : <Geozone1Frame />}</React.StrictMode>
);
