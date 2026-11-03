import React from 'react';

export const Header = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
            GZ
          </div>
          <div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">GeoZone AI</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Zone-based Planner
            </span>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          Đề tài IT3150 - Lập lịch trình du lịch thông minh
        </div>
      </div>
    </header>
  );
};
