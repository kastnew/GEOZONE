import React from 'react';
import { GeneratedPlanResponse } from '../../types/index.js';

interface ZoneMapViewProps {
  plan: GeneratedPlanResponse;
}

export const ZoneMapView: React.FC<ZoneMapViewProps> = ({ plan }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          Bản đồ Phân cụm Zone
        </h3>
        <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
          {plan.days.length} Cụm khu vực
        </span>
      </div>

      {/* Placeholder bản đồ trực quan */}
      <div className="h-64 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
        <span className="text-3xl mb-2">🗺️</span>
        <p className="text-xs font-medium text-slate-600">Bản đồ trực quan hóa các Zone đã phân bổ</p>
        <p className="text-[11px] text-slate-400 mt-1">
          (Tích hợp Leaflet / Mapbox theo tọa độ lat/lng của từng địa điểm trong ngày)
        </p>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-700 block">Danh sách Zone theo ngày:</span>
        <div className="flex flex-wrap gap-2">
          {plan.days.map(d => (
            <span
              key={d.dayNumber}
              className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200 font-medium"
            >
              Ngày {d.dayNumber}: {d.zoneName}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
