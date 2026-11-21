import React from 'react';

export default function Toast({ message = '', isVisible = false }) {
  return (
    <div
      className={`gz-toast ${isVisible ? 'show' : ''}`}
      id="gzToast"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
