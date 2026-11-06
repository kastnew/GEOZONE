import React from 'react';
import { DayCard } from './DayCard.jsx';

export const TimelineView = ({ plan, onSwapRequest, onSaveRequest, isSaved = false }) => {
  return (
    <div className="space-y-4">
      {/* Banner tổng quan chuyến đi */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-white/20">
              {plan.strategyUsed === 'RAG_AUGMENTED' ? '✨ Chế độ RAG Đã Kích Hoạt' : '⚡ Chế độ Tối ưu Trực tiếp (No-RAG)'}
            </span>
            <span className="text-xs text-blue-100">{plan.city} • {plan.totalDays} Ngày</span>
          </div>

          {/* Nút Lưu lịch trình */}
          {onSaveRequest && (
            <button
              onClick={onSaveRequest}
              disabled={isSaved}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer ${
                isSaved
                  ? 'bg-emerald-500 text-white cursor-default'
                  : 'bg-white text-blue-700 hover:bg-blue-50 active:scale-95'
              }`}
            >
              <span>{isSaved ? '✅' : '💾'}</span>
              <span>{isSaved ? 'Đã lưu vào Chuyến đi' : 'Lưu lịch trình này'}</span>
            </button>
          )}
        </div>

        <p className="mt-3 text-sm text-blue-50 leading-relaxed font-normal">
          {plan.overallSummary}
        </p>
      </div>

      {/* Danh sách từng ngày */}
      <div>
        {plan.days.map(day => (
          <DayCard key={day.dayNumber} day={day} onSwapRequest={onSwapRequest} />
        ))}
      </div>
    </div>
  );
};
