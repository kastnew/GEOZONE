import React from 'react';

export const SwapModal = ({
  isOpen,
  onClose,
  targetActivity,
  dayNumber,
  onConfirmSwap,
  isSwapping
}) => {
  if (!isOpen || !targetActivity || dayNumber === null) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800">Hoán đổi địa điểm động</h3>
        <p className="text-xs text-slate-500 mt-1">
          Hệ thống sẽ tìm một địa điểm khác trong cùng <strong className="text-blue-600">{targetActivity.zoneName}</strong> để thay thế mà không làm phá vỡ lộ trình di chuyển.
        </p>

        <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-400 uppercase font-semibold">Địa điểm hiện tại:</span>
          <p className="text-sm font-bold text-slate-800 mt-0.5">{targetActivity.placeName}</p>
          <span className="text-xs text-slate-500">Khung giờ: {targetActivity.timeSlot}</span>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSwapping}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onConfirmSwap(targetActivity, dayNumber)}
            disabled={isSwapping}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isSwapping ? 'Đang tìm kiếm...' : 'Xác nhận đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};
