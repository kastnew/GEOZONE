import React, { useState } from 'react';
import { Header } from './components/common/Header.js';
import { Footer } from './components/common/Footer.js';
import { LoadingSpinner } from './components/common/LoadingSpinner.js';
import { TripInputForm } from './components/form/TripInputForm.js';
import { TimelineView } from './components/timeline/TimelineView.js';
import { SwapModal } from './components/timeline/SwapModal.js';
import { BudgetSummaryCard } from './components/summary/BudgetSummaryCard.js';
import { ZoneMapView } from './components/map/ZoneMapView.js';
import { TripInputState, GeneratedPlanResponse, ActivityItem } from './types/index.js';
import { generateItineraryApi, swapPlaceApi } from './services/api.js';

export const App: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<GeneratedPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State cho Dynamic Swap Modal
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapTargetActivity, setSwapTargetActivity] = useState<ActivityItem | null>(null);
  const [swapTargetDayNumber, setSwapTargetDayNumber] = useState<number | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  const handleGeneratePlan = async (input: TripInputState) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const plan = await generateItineraryApi(input);
      setCurrentPlan(plan);
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã có lỗi xảy ra khi tạo lịch trình');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSwapModal = (activity: ActivityItem, dayNumber: number) => {
    setSwapTargetActivity(activity);
    setSwapTargetDayNumber(dayNumber);
    setIsSwapModalOpen(true);
  };

  const handleConfirmSwap = async (oldActivity: ActivityItem, dayNumber: number) => {
    if (!currentPlan) return;
    setIsSwapping(true);
    try {
      const excludedIds = currentPlan.days.flatMap(d => d.activities.map(a => a.placeId));
      const newActivity = await swapPlaceApi({
        currentPlaceId: oldActivity.placeId,
        dayNumber,
        targetZoneId: oldActivity.zoneId,
        remainingBudget: 500000,
        excludedPlaceIds: excludedIds,
        userPreferences: ['food', 'beach', 'culture']
      });

      // Cập nhật lại lịch trình
      const updatedDays = currentPlan.days.map(d => {
        if (d.dayNumber === dayNumber) {
          const updatedActs = d.activities.map(a =>
            a.placeId === oldActivity.placeId ? { ...newActivity, timeSlot: a.timeSlot } : a
          );
          const newCost = updatedActs.reduce((acc, a) => acc + a.estimatedCost, 0);
          return { ...d, activities: updatedActs, totalEstimatedCost: newCost };
        }
        return d;
      });

      const newActualCost = updatedDays.reduce((acc, d) => acc + d.totalEstimatedCost, 0);
      setCurrentPlan({
        ...currentPlan,
        actualCost: newActualCost,
        days: updatedDays
      });
      setIsSwapModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Không thể đổi địa điểm lúc này');
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cột trái: Form điều khiển & Tổng kết */}
          <div className="lg:col-span-5 space-y-6">
            <TripInputForm onSubmit={handleGeneratePlan} isLoading={isLoading} />
            {currentPlan && (
              <>
                <BudgetSummaryCard plan={currentPlan} />
                <ZoneMapView plan={currentPlan} />
              </>
            )}
          </div>

          {/* Cột phải: Timeline hiển thị */}
          <div className="lg:col-span-7">
            {isLoading && <LoadingSpinner />}
            {!isLoading && currentPlan && (
              <TimelineView plan={currentPlan} onSwapRequest={handleOpenSwapModal} />
            )}
            {!isLoading && !currentPlan && (
              <div className="h-full flex flex-col items-center justify-center bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-400">
                <span className="text-4xl mb-3">🧭</span>
                <h3 className="text-base font-bold text-slate-700">Chưa có lịch trình</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Hãy điền ngân sách, số ngày và sở thích ở cột bên trái để bắt đầu lập kế hoạch thông minh.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <SwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        targetActivity={swapTargetActivity}
        dayNumber={swapTargetDayNumber}
        onConfirmSwap={handleConfirmSwap}
        isSwapping={isSwapping}
      />

      <Footer />
    </div>
  );
};

export default App;
