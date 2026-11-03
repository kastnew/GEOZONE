import React, { useState } from 'react';
import { TagSelector } from './TagSelector.jsx';
import { BudgetSlider } from './BudgetSlider.jsx';

export const TripInputForm = ({ onSubmit, isLoading }) => {
  const [city] = useState('Đà Nẵng');
  const [days, setDays] = useState(2);
  const [budget, setBudget] = useState(1500000);
  const [tags, setTags] = useState(['food', 'beach', 'culture']);
  const [enableRag, setEnableRag] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      city: 'Da Nang',
      days,
      totalBudget: budget,
      preferences: tags,
      enableRag
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-800">Thiết lập chuyến đi</h2>
        <p className="text-xs text-slate-500 mt-1">
          Nhập các thông số để GeoZone tự động tối ưu hóa theo phân vùng địa lý và ngân sách
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Điểm đến
          </label>
          <input
            type="text"
            disabled
            value={city}
            className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Số ngày lưu trú
          </label>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value={1}>1 ngày</option>
            <option value={2}>2 ngày (Khuyên dùng)</option>
            <option value={3}>3 ngày</option>
            <option value={4}>4 ngày</option>
          </select>
        </div>
      </div>

      <BudgetSlider budget={budget} onChange={setBudget} />

      <TagSelector selectedTags={tags} onChange={setTags} />

      {/* Switch lựa chọn Phương án: Không RAG vs Có RAG */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-slate-800">Kích hoạt RAG (Cẩm nang tri thức)</span>
            <p className="text-xs text-slate-500">
              {enableRag
                ? 'Phương án CÓ RAG: Làm giàu lịch trình với mẹo ẩm thực, quy định văn hóa từ Vector DB'
                : 'Phương án KHÔNG RAG: Sinh trực tiếp từ dữ liệu DB có cấu trúc, tối ưu tốc độ và chi phí'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnableRag(!enableRag)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enableRag ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                enableRag ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md disabled:opacity-50 cursor-pointer"
      >
        {isLoading ? 'Đang phân tích và lập lịch...' : 'Tạo lịch trình tối ưu'}
      </button>
    </form>
  );
};
