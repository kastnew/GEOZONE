import React, { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import { CITIES, formatVND } from '../../data/mockData';
import { createPlan } from '../../services/api.js';
import '../../styles/Trips.css';

export const SavePlanModal = ({ isOpen, onClose, currentPlan, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const city = CITIES[currentPlan?.city] || CITIES.danang;
  const daysCount = currentPlan?.totalDays || currentPlan?.daysCount || currentPlan?.days?.length || 1;
  const actualCost = currentPlan?.actualCost ?? currentPlan?.totalCost ?? 0;

  useEffect(() => {
    if (!isOpen || !currentPlan) return;
    setTitle(currentPlan.title || `Khám phá ${city.name} ${daysCount} ngày`);
    setIsPublic(false);
    setErrorMsg('');
  }, [isOpen, currentPlan, city.name, daysCount]);

  if (!isOpen || !currentPlan) return null;

  const handleSave = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const saved = await createPlan({
        ...currentPlan,
        title: title.trim(),
        is_public: isPublic,
        totalDays: Number(daysCount),
        actualCost: Number(actualCost)
      });
      onSuccess(saved);
      onClose();
    } catch (error) {
      setErrorMsg(error.message || 'Không thể lưu lịch trình. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="gz-plan-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) onClose();
      }}
    >
      <section
        className="gz-plan-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gz-save-plan-title"
      >
        <button className="gz-plan-modal-close" type="button" onClick={onClose} disabled={isLoading} aria-label="Đóng">
          <X size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <div className="gz-plan-modal-heading">
          <span className="gz-plan-modal-icon"><Save size={20} strokeWidth={1.75} aria-hidden="true" /></span>
          <div>
            <h2 id="gz-save-plan-title">Lưu chuyến đi</h2>
            <p>Lưu lịch trình vào tài khoản để xem lại và chia sẻ bất cứ lúc nào.</p>
          </div>
        </div>

        {errorMsg && <p className="gz-plan-modal-error" role="alert">{errorMsg}</p>}

        <form onSubmit={handleSave}>
          <label className="gz-plan-field">
            <span>Tên chuyến đi</span>
            <input
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={`Khám phá ${city.name} ${daysCount} ngày`}
            />
          </label>

          <label className="gz-plan-field">
            <span>Quyền riêng tư</span>
            <select value={isPublic ? 'public' : 'private'} onChange={(event) => setIsPublic(event.target.value === 'public')}>
              <option value="private">Riêng tư — chỉ bạn xem được</option>
              <option value="public">Công khai — có thể chia sẻ bằng liên kết</option>
            </select>
          </label>

          <div className="gz-plan-save-summary">
            <span>Điểm đến <strong>{city.name}</strong></span>
            <span>Thời lượng <strong>{daysCount} ngày</strong></span>
            <span>Chi phí dự kiến <strong className="gz-numeric">{formatVND(actualCost)}</strong></span>
          </div>

          <div className="gz-plan-modal-actions">
            <button type="button" className="gz-btn ghost" onClick={onClose} disabled={isLoading}>Hủy</button>
            <button type="submit" className="gz-btn" disabled={isLoading || !title.trim()}>
              <Save size={16} strokeWidth={1.75} aria-hidden="true" />
              {isLoading ? 'Đang lưu…' : 'Lưu lịch trình'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
