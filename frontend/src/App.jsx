import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header.jsx';
import { Footer } from './components/common/Footer.jsx';
import { LoadingSpinner } from './components/common/LoadingSpinner.jsx';
import { TripInputForm } from './components/form/TripInputForm.jsx';
import { TimelineView } from './components/timeline/TimelineView.jsx';
import { SwapModal } from './components/timeline/SwapModal.jsx';
import { BudgetSummaryCard } from './components/summary/BudgetSummaryCard.jsx';
import { ZoneMapView } from './components/map/ZoneMapView.jsx';
import { AuthModal } from './components/auth/AuthModal.jsx';
import { SavePlanModal } from './components/saved/SavePlanModal.jsx';
import { MyTripsView } from './components/saved/MyTripsView.jsx';
import {
  generateItineraryApi,
  swapPlaceApi,
  getStoredUser,
  getMeApi,
  logout
} from './services/api.js';

export const App = () => {
  // Navigation tab: 'planner' | 'my-trips'
  const [activeTab, setActiveTab] = useState('planner');

  // User Auth State
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Planner States
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isCurrentPlanSaved, setIsCurrentPlanSaved] = useState(false);

  // Dynamic Swap States
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapTargetActivity, setSwapTargetActivity] = useState(null);
  const [swapTargetDayNumber, setSwapTargetDayNumber] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // Save Plan Modal
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Đồng bộ kiểm tra token khi tải trang
  useEffect(() => {
    const token = localStorage.getItem('geozone_token');
    if (token) {
      getMeApi()
        .then(user => setCurrentUser(user))
        .catch(() => {
          logout();
          setCurrentUser(null);
        });
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    if (activeTab === 'my-trips') {
      setActiveTab('planner');
    }
  };

  const handleGeneratePlan = async (input) => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsCurrentPlanSaved(false);
    try {
      const plan = await generateItineraryApi(input);
      setCurrentPlan(plan);
      setActiveTab('planner');
    } catch (err) {
      setErrorMessage(err.message || 'Đã có lỗi xảy ra khi tạo lịch trình');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSwapModal = (activity, dayNumber) => {
    setSwapTargetActivity(activity);
    setSwapTargetDayNumber(dayNumber);
    setIsSwapModalOpen(true);
  };

  const handleConfirmSwap = async (oldActivity, dayNumber) => {
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
      setIsCurrentPlanSaved(false);
      setIsSwapModalOpen(false);
    } catch (err) {
      alert(err.message || 'Không thể đổi địa điểm lúc này');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleSaveClick = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSaveModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsCurrentPlanSaved(true);
    alert('Đã lưu lịch trình thành công! Bạn có thể xem lại tại mục "Chuyến đi của tôi".');
  };

  const handleSelectSavedPlan = (planData) => {
    setCurrentPlan(planData);
    setIsCurrentPlanSaved(true);
    setActiveTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Tab 1: Trình lập lịch trình (Planner View) */}
        {activeTab === 'planner' && (
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
                <TimelineView
                  plan={currentPlan}
                  onSwapRequest={handleOpenSwapModal}
                  onSaveRequest={handleSaveClick}
                  isSaved={isCurrentPlanSaved}
                />
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
        )}

        {/* Tab 2: Chuyến đi của tôi (My Trips View) */}
        {activeTab === 'my-trips' && (
          <MyTripsView
            currentUser={currentUser}
            onSelectPlan={handleSelectSavedPlan}
            onGoToPlanner={() => setActiveTab('planner')}
          />
        )}
      </main>

      {/* Modal Hoán đổi địa điểm */}
      <SwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        targetActivity={swapTargetActivity}
        dayNumber={swapTargetDayNumber}
        onConfirmSwap={handleConfirmSwap}
        isSwapping={isSwapping}
      />

      {/* Modal Đăng nhập / Đăng ký */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Modal Lưu lịch trình */}
      <SavePlanModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        currentPlan={currentPlan}
        onSuccess={handleSaveSuccess}
      />

      <Footer />
    </div>
  );
};

export default App;
