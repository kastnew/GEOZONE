import React from 'react';
import { GeneratedPlanResponse, ActivityItem } from '../../types/index.js';
import { DayCard } from './DayCard.js';

interface TimelineViewProps {
  plan: GeneratedPlanResponse;
  onSwapRequest: (activity: ActivityItem, dayNumber: number) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ plan, onSwapRequest }) => {
  return (
    <div className="space-y-4">
      {/* Banner tổng quan chuyến đi */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-white/20">
            {plan.strategyUsed === 'RAG_AUGMENTED' ? '✨ Chế độ RAG Đã Kích Hoạt' : '⚡ Chế độ Tối ưu Trực tiếp (No-RAG)'}
          </span>
          <span className="text-xs text-blue-100">{plan.city} • {plan.totalDays} Ngày</span>
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
