import React from 'react';

export const BudgetSummaryCard = ({ plan }) => {
  const formatVnd = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const remaining = plan.totalBudget - plan.actualCost;
  const isOverBudget = remaining < 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
        Kiểm soát Ngân sách
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-xs text-slate-500 block">Ngân sách dự chi:</span>
          <span className="text-sm font-bold text-slate-800">{formatVnd(plan.totalBudget)}</span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-xs text-slate-500 block">Chi phí thực tế:</span>
          <span className="text-sm font-bold text-blue-600">{formatVnd(plan.actualCost)}</span>
        </div>
      </div>

      <div className={`p-3 rounded-xl text-xs font-semibold ${isOverBudget ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
        {isOverBudget ? (
          <span>⚠️ Vượt ngân sách: {formatVnd(Math.abs(remaining))}</span>
        ) : (
          <span>✅ Tiết kiệm dự kiến: {formatVnd(remaining)} (Hoàn toàn nằm trong ngân sách)</span>
        )}
      </div>
    </div>
  );
};
