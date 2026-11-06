import React, { useState, useEffect } from 'react';
import { getMyPlansApi, getPlanByIdApi, deletePlanApi } from '../../services/api.js';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';

export const MyTripsView = ({ onSelectPlan, onGoToPlanner, currentUser }) => {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchTrips = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getMyPlansApi();
      setTrips(data);
    } catch (err) {
      setErrorMsg(err.message || 'Không thể tải danh sách chuyến đi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleOpenPlan = async (id) => {
    setActionLoadingId(id);
    try {
      const fullPlan = await getPlanByIdApi(id);
      if (fullPlan && fullPlan.planData) {
        onSelectPlan(fullPlan.planData);
      }
    } catch (err) {
      alert(err.message || 'Không thể mở lịch trình');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Bạn có chắc muốn xóa lịch trình "${title}" không?`)) {
      return;
    }

    try {
      await deletePlanApi(id);
      setTrips(trips.filter(t => t.id !== id));
    } catch (err) {
      alert(err.message || 'Không thể xóa lịch trình');
    }
  };

  const formatVnd = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('vi-VN')} lúc ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (isLoading) {
    return <LoadingSpinner message="Đang tải danh sách chuyến đi của bạn..." />;
  }

  return (
    <div className="space-y-6">
      {/* Banner đầu trang */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <span>🧳</span>
            <span>Chuyến đi của tôi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tất cả các lịch trình du lịch bạn đã tạo và lưu trữ trên hệ thống GeoZone.
          </p>
        </div>

        <button
          onClick={onGoToPlanner}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          + Tạo lịch trình mới
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Danh sách các chuyến đi */}
      {trips.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-400">
          <span className="text-5xl mb-3 block">🏝️</span>
          <h3 className="text-base font-bold text-slate-700">Chưa có chuyến đi nào được lưu</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Bạn chưa lưu lịch trình du lịch nào. Hãy sử dụng công cụ AI Planner để tạo chuyến đi tự động và nhấn "Lưu lịch trình".
          </p>
          <button
            onClick={onGoToPlanner}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm cursor-pointer"
          >
            Bắt đầu lập lịch trình ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {trip.city} • {trip.totalDays} Ngày
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDate(trip.createdAt)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 mt-2 line-clamp-1">
                  {trip.planTitle}
                </h3>

                <div className="my-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Ngân sách:</span>
                    <strong className="text-slate-700">{formatVnd(trip.totalBudget)}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Chi phí thực tế:</span>
                    <strong className="text-blue-600">{formatVnd(trip.actualCost)}</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                  <span>Chế độ AI:</span>
                  <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {trip.strategyUsed === 'RAG_AUGMENTED' ? '✨ CÓ RAG' : '⚡ KHÔNG RAG'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={() => handleDelete(trip.id, trip.planTitle)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition cursor-pointer"
                >
                  Xóa
                </button>
                <button
                  disabled={actionLoadingId === trip.id}
                  onClick={() => handleOpenPlan(trip.id)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === trip.id ? 'Đang mở...' : '👁️ Xem chi tiết'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
