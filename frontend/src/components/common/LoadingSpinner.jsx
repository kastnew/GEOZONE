import React from 'react';

export const LoadingSpinner = ({ message = 'Đang tính toán và sinh lịch trình...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-slate-600 font-medium text-sm animate-pulse">{message}</p>
    </div>
  );
};
