import React, { useEffect, useState } from 'react';
import { DayCard } from './DayCard.jsx';
import { Check, Cloud, Save } from 'lucide-react';
import { formatVND } from '../../data/mockData';

export const TimelineView = ({ plan, onSwapRequest, onSaveRequest, isSaved = false }) => {
  const [selectedDay, setSelectedDay] = useState(0);
  const days = plan?.days || [];
  const activeDay = days[selectedDay] || days[0];
  const totalBudget = Number(plan?.totalBudget ?? plan?.budget ?? 0);
  const actualCost = Number(plan?.actualCost ?? plan?.totalCost ?? 0);
  const budgetRatio = totalBudget > 0 ? Math.min((actualCost / totalBudget) * 100, 100) : 0;

  useEffect(() => {
    setSelectedDay(0);
  }, [plan]);

  return (
    <div className="space-y-4">
      {/* Banner tổng quan chuyến đi */}
      <div className="timeline-summary rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-white/20">
              {plan.strategyUsed === 'RAG_AUGMENTED' ? <><Cloud size={14} strokeWidth={1.75} aria-hidden="true" /> Chế độ RAG Đã Kích Hoạt</> : 'Chế độ Tối ưu Trực tiếp (No-RAG)'}
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
              {isSaved ? <Check size={16} strokeWidth={1.75} aria-hidden="true" /> : <Save size={16} strokeWidth={1.75} aria-hidden="true" />}
              <span>{isSaved ? 'Đã lưu vào Chuyến đi' : 'Lưu lịch trình này'}</span>
            </button>
          )}
        </div>

        <p className="mt-3 text-sm text-blue-50 leading-relaxed font-normal">
          {plan.overallSummary}
        </p>
      </div>

      {totalBudget > 0 && (
        <div className={`gz-budget-summary ${actualCost > totalBudget ? 'is-over' : ''}`}>
          <div className="gz-budget-summary-head">
            <span>Ngân sách chuyến đi</span>
            <strong><span className="gz-numeric">{formatVND(actualCost)}</span> / <span className="gz-numeric">{formatVND(totalBudget)}</span></strong>
          </div>
          <div className="gz-budget-track" aria-label={`Đã dùng ${Math.round(budgetRatio)} phần trăm ngân sách`}>
            <span style={{ width: `${budgetRatio}%` }} />
          </div>
        </div>
      )}

      {/* Danh sách từng ngày */}
      <div>
        <div className="gz-day-tabs" role="tablist" aria-label="Các ngày trong lịch trình">
          {days.map((day, index) => (
            <button
              type="button"
              key={day.dayNumber || index}
              role="tab"
              aria-selected={selectedDay === index}
              className={selectedDay === index ? 'is-active' : ''}
              onClick={() => setSelectedDay(index)}
            >
              Ngày {day.dayNumber || index + 1}
            </button>
          ))}
        </div>
        {activeDay && (
          <div className="gz-day-panel" key={activeDay.dayNumber || selectedDay}>
            <DayCard day={activeDay} onSwapRequest={onSwapRequest} />
          </div>
        )}
      </div>
    </div>
  );
};
