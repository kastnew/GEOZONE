import React, { useState } from 'react';
import { ArrowRightLeft, ChevronDown, Lightbulb } from 'lucide-react';

export const PlaceItem = ({ activity, dayNumber, onSwapRequest }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const formatVnd = (val) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(val);
  const hasDetails = activity.aiDescription || activity.aiTravelTip ||
    activity.address || activity.fullAddress || activity.openingHours;

  return (
    <div className="relative pl-6 pb-6 border-l-2 border-blue-200 last:border-l-0 last:pb-0">
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
              type="button"
              onClick={() => onSwapRequest(activity, dayNumber)}
              className="mt-2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
            >
              <ArrowRightLeft size={14} strokeWidth={1.75} aria-hidden="true" /> Đổi địa điểm
            </button>
          </div>
        </div>

        {hasDetails && (
          <>
            <button type="button" className="gz-details-toggle" aria-expanded={isExpanded} onClick={() => setIsExpanded((expanded) => !expanded)}>
              <span>{isExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}</span>
              <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <div className={`gz-details-accordion ${isExpanded ? 'is-open' : ''}`}>
              <div>
                {(activity.address || activity.fullAddress) && <p className="gz-place-detail"><strong>Địa chỉ:</strong> {activity.address || activity.fullAddress}</p>}
                {activity.openingHours && <p className="gz-place-detail"><strong>Giờ mở cửa:</strong> {activity.openingHours}</p>}
                {activity.aiDescription && <p className="gz-place-narrative">"{activity.aiDescription}"</p>}
                {activity.aiTravelTip && (
                  <div className="gz-place-tip">
                    <Lightbulb size={14} strokeWidth={1.75} aria-hidden="true" />
                    <span><strong>Mẹo bản địa:</strong> {activity.aiTravelTip}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
