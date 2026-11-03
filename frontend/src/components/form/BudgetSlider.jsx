import React from 'react';

export const BudgetSlider = ({ budget, onChange }) => {
  const formatVnd = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-slate-700">
          Tổng ngân sách dự kiến
        </label>
        <span className="text-base font-bold text-blue-600">
          {formatVnd(budget)}
        </span>
      </div>
      <input
        type="range"
        min={500000}
        max={10000000}
        step={500000}
        value={budget}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>500.000đ</span>
        <span>5.000.000đ</span>
        <span>10.000.000đ</span>
      </div>
    </div>
  );
};
