import React from 'react';
import { ActivityItem } from '../../types/index.js';

interface PlaceItemProps {
  activity: ActivityItem;
  dayNumber: number;
  onSwapRequest: (activity: ActivityItem, dayNumber: number) => void;
}

export const PlaceItem: React.FC<PlaceItemProps> = ({ activity, dayNumber, onSwapRequest }) => {
  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="relative pl-6 pb-6 border-l-2 border-blue-200 last:border-l-0 last:pb-0">
      {/* Node bullet trên dòng thời gian */}
      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm" />

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all hover:shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              {activity.timeSlot}
            </span>
            <h4 className="text-base font-bold text-slate-800 mt-1">{activity.placeName}</h4>
            <span className="text-xs text-slate-500 font-medium">Khu vực: {activity.zoneName}</span>
          </div>

          <div className="text-right">
            <span className="text-sm font-bold text-emerald-600 block">
              {activity.estimatedCost > 0 ? formatVnd(activity.estimatedCost) : 'Miễn phí'}
            </span>
            <button
              onClick={() => onSwapRequest(activity, dayNumber)}
              className="mt-2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            >
              🔄 Đổi địa điểm
            </button>
          </div>
        </div>

        {/* Narrative do LLM sinh ra */}
        {activity.aiDescription && (
          <p className="mt-3 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 italic">
            "{activity.aiDescription}"
          </p>
        )}

        {/* Travel tip từ cẩm nang RAG (nếu có) */}
        {activity.aiTravelTip && (
          <div className="mt-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-start space-x-1.5">
            <span>💡</span>
            <span><strong>Mẹo bản địa:</strong> {activity.aiTravelTip}</span>
          </div>
        )}
      </div>
    </div>
  );
};
