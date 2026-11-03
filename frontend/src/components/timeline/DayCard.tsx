import React from 'react';
import { DayPlan, ActivityItem } from '../../types/index.js';
import { PlaceItem } from './PlaceItem.js';

interface DayCardProps {
  day: DayPlan;
  onSwapRequest: (activity: ActivityItem, dayNumber: number) => void;
}

export const DayCard: React.FC<DayCardProps> = ({ day, onSwapRequest }) => {
  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            Ngày {day.dayNumber}
          </span>
          <h3 className="text-lg font-bold text-slate-800 mt-1">{day.title}</h3>
          <p className="text-xs text-slate-500">
            Trọng tâm phân vùng: <span className="font-semibold text-slate-700">{day.zoneName}</span>
          </p>
        </div>

        <div className="text-left sm:text-right bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="text-xs text-slate-500 block">Dự toán ngày:</span>
          <span className="text-base font-bold text-slate-800">
            {formatVnd(day.totalEstimatedCost)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {day.activities.map(activity => (
          <PlaceItem
            key={activity.placeId}
            activity={activity}
            dayNumber={day.dayNumber}
            onSwapRequest={onSwapRequest}
          />
        ))}
      </div>
    </div>
  );
};
