import React, { useState } from 'react';
import { savePlanApi } from '../../services/api.js';

export const SavePlanModal = ({ isOpen, onClose, currentPlan, onSuccess }) => {
  const [title, setTitle] = useState(
    currentPlan ? `Chuyến đi ${currentPlan.city} ${currentPlan.totalDays} ngày` : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen || !currentPlan) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        planTitle: title.trim() || `Chuyến đi ${currentPlan.city} ${currentPlan.totalDays} ngày`,
        city: currentPlan.city,
        totalDays: currentPlan.totalDays,
        totalBudget: currentPlan.totalBudget,
        actualCost: currentPlan.actualCost,
        strategyUsed: currentPlan.strategyUsed,
        planData: currentPlan
      };

      const saved = await savePlanApi(payload);
      onSuccess(saved);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi lưu lịch trình');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800">💾 Lưu lịch trình vào tài khoản</h3>
        <p className="text-xs text-slate-500 mt-1">
          Lịch trình sẽ được lưu vĩnh viễn để bạn có thể xem lại bất kỳ lúc nào tại mục "Chuyến đi của tôi".
        </p>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Đặt tên cho chuyến đi
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Chuyến du lịch Đà Nẵng 3 ngày cùng gia đình"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1 border border-slate-100">
            <div className="flex justify-between">
              <span>Điểm đến:</span>
              <strong className="text-slate-800">{currentPlan.city}</strong>
            </div>
            <div className="flex justify-between">
              <span>Thời gian:</span>
              <strong className="text-slate-800">{currentPlan.totalDays} ngày</strong>
            </div>
            <div className="flex justify-between">
              <span>Chi phí dự toán:</span>
              <strong className="text-blue-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPlan.actualCost)}
              </strong>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Đang lưu...' : 'Xác nhận lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
