import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 mt-16 text-center text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <p className="font-medium text-slate-300">GeoZone AI — Nền tảng phân vùng địa lý và tối ưu hành trình</p>
        <p className="mt-1 text-xs text-slate-500">
          Kết hợp thuật toán phân cụm khu vực (Zone Clustering) và Mô hình ngôn ngữ lớn (LLM).
        </p>
      </div>
    </footer>
  );
};
