import React, { useState, useEffect } from 'react';
import './styles/global.css';

// Layout & Common Components
import Navbar from './components/layout/Navbar';
import BottomBack from './components/layout/BottomBack';
import Toast from './components/common/Toast';

// Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ExplorePage from './pages/ExplorePage';
import TripsPage from './pages/TripsPage';
import FavoritesPage from './pages/FavoritesPage';
import AccountPage from './pages/AccountPage';

// Modals
import AuthModal from './components/modals/AuthModal';
import TripCartModal from './components/modals/TripCartModal';
import TripDetailModal from './components/modals/TripDetailModal';
import AdminPlaceModal from './components/modals/AdminPlaceModal';

// Mock Data
import {
  CITIES,
  MOCK_SAVED_PLANS,
  MOCK_SAMPLE_FAVORITES,
  getCityZones
} from './data/mockData';

// Service Layer (Backend APIs)
import {
  getToken,
  getStoredUser,
  loginApi,
  registerApi,
  logoutApi,
  getMeApi,
  updateProfileApi,
  changePasswordApi,
  savePlanApi,
  getMyPlansApi,
  deletePlanApi,
  getMyFavoritesApi,
  addFavoriteApi,
  removeFavoriteApi,
  adminCreatePlaceApi,
  adminUpdatePlaceApi,
  adminDeletePlaceApi,
  deleteAccountApi,
  exportDataApi,
  resetDatabaseApi,
  revertPlaceApi
} from './services/api';

export default function App() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'about' | 'explore' | 'trips' | 'favs' | 'account'
  const [exploreMode, setExploreMode] = useState('explore'); // 'explore' | 'planner'
  const [selectedCity, setSelectedCity] = useState('hue');

  // User & Auth State
  const [user, setUser] = useState(() => getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [authError, setAuthError] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Trips & Cart State
  const [trips, setTrips] = useState(MOCK_SAVED_PLANS);
  const [cartItems, setCartItems] = useState([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [selectedTripDetail, setSelectedTripDetail] = useState(null);

  // Favorites State
  const [favorites, setFavorites] = useState(MOCK_SAMPLE_FAVORITES);
  const [selectedFavCityFilter, setSelectedFavCityFilter] = useState('all');

  // Admin Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPlaceToEdit, setAdminPlaceToEdit] = useState(null);
  const [isAdminNewPlace, setIsAdminNewPlace] = useState(false);

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3200);
  };

  // 1. Initial Load: Sync User, Plans, and Favorites from Backend
  useEffect(() => {
    const token = getToken();
    if (token) {
      getMeApi()
        .then((userData) => {
          if (userData) setUser(userData);
        })
        .catch(() => {});
    }

    // Load initial plans from Backend
    getMyPlansApi()
      .then((data) => {
        if (data && data.length > 0) setTrips(data);
      })
      .catch(() => {});

    // Load initial favorites from Backend
    getMyFavoritesApi()
      .then((data) => {
        if (data && data.length > 0) setFavorites(data);
      })
      .catch(() => {});
  }, []);

  // Navigation Handler
  const handleNavigate = (view, options = {}) => {
    setCurrentView(view);
    if (options.mode) {
      setExploreMode(options.mode === 'plan' ? 'planner' : options.mode);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Handlers
  const handleLogin = async (credentials) => {
    setAuthError('');
    try {
      const loggedInUser = await loginApi(credentials);
      setUser(loggedInUser);
      setIsAuthModalOpen(false);
      showToast(`Chào mừng ${loggedInUser.name || loggedInUser.username}!`);
      // Reload user data
      getMyPlansApi().then((p) => p && setTrips(p)).catch(() => {});
      getMyFavoritesApi().then((f) => f && setFavorites(f)).catch(() => {});
    } catch (err) {
      setAuthError(err.message || 'Đăng nhập không thành công');
    }
  };

  const handleRegister = async (data) => {
    setAuthError('');
    try {
      const newUser = await registerApi(data);
      setUser(newUser);
      setIsAuthModalOpen(false);
      showToast(`Đăng ký tài khoản thành công!`);
    } catch (err) {
      setAuthError(err.message || 'Đăng ký không thành công');
    }
  };

  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
    showToast('Đã đăng xuất tài khoản.');
  };

  // Cart & Trip Handlers
  const handleToggleCart = (place) => {
    const exists = cartItems.some((c) => c.id === place.id);
    if (exists) {
      setCartItems(cartItems.filter((c) => c.id !== place.id));
      showToast(`Đã bỏ ${place.name} khỏi lịch trình.`);
    } else {
      setCartItems([...cartItems, place]);
      showToast(`Đã thêm ${place.name} vào lịch trình!`);
    }
  };

  const handleSaveCartAsTrip = async () => {
    if (cartItems.length === 0) return;
    const currentCityConfig = CITIES[selectedCity] || CITIES.hue;
    const newTripPayload = {
      name: `Chuyến đi ${currentCityConfig.name} (${cartItems.length} địa điểm)`,
      city: selectedCity,
      cityName: currentCityConfig.name,
      daysCount: Math.ceil(cartItems.length / 3),
      totalCost: cartItems.reduce((acc, p) => acc + (p.estimatedCost || p.cost || 0), 0),
      days: [
        {
          dayNumber: 1,
          title: `Khám phá các điểm nổi bật`,
          places: cartItems
        }
      ]
    };

    try {
      const savedTrip = await savePlanApi(newTripPayload);
      setTrips([savedTrip, ...trips]);
      setCartItems([]);
      setIsCartModalOpen(false);
      showToast('Đã lưu chuyến đi thành công vào tài khoản của bạn!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu chuyến đi');
    }
  };

  const handleSaveGeneratedPlan = async (generatedPlan) => {
    if (!generatedPlan) return;
    try {
      const savedTrip = await savePlanApi(generatedPlan);
      setTrips([savedTrip, ...trips]);
      showToast('Đã lưu lịch trình tối ưu vào Chuyến đi của tôi!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu lịch trình');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      await deletePlanApi(tripId);
      setTrips(trips.filter((t) => t.id !== tripId));
      showToast('Đã xóa chuyến đi thành công.');
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa chuyến đi');
    }
  };

  const handleClearAllTrips = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả chuyến đi đã lưu không?')) {
      setTrips([]);
      showToast('Đã xóa toàn bộ chuyến đi.');
    }
  };

  // Favorites Handlers
  const handleToggleFavorite = async (place) => {
    const exists = favorites.some((f) => f.id === place.id);
    if (exists) {
      try {
        await removeFavoriteApi(place.id);
        setFavorites(favorites.filter((f) => f.id !== place.id));
        showToast(`Đã xóa khỏi danh sách yêu thích.`);
      } catch (err) {
        showToast(err.message);
      }
    } else {
      try {
        await addFavoriteApi(place.id);
        setFavorites([
          ...favorites,
          {
            ...place,
            city: place.city || selectedCity
          }
        ]);
        showToast(`Đã thêm vào danh sách yêu thích!`);
      } catch (err) {
        showToast(err.message);
      }
    }
  };

  const handleRemoveFavorite = async (placeId) => {
    try {
      await removeFavoriteApi(placeId);
      setFavorites(favorites.filter((f) => f.id !== placeId));
      showToast('Đã xóa địa điểm khỏi mục yêu thích.');
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleClearAllFavorites = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả địa điểm yêu thích không?')) {
      setFavorites([]);
      showToast('Đã xóa toàn bộ địa điểm yêu thích.');
    }
  };

  // Profile Handlers
  const handleUpdateProfile = async (profileData) => {
    try {
      const updatedUser = await updateProfileApi(profileData);
      setUser({ ...user, ...updatedUser });
      showToast('Cập nhật thông tin thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật thông tin');
    }
  };

  const handleChangePassword = async (passData) => {
    try {
      await changePasswordApi(passData);
      showToast('Đã đổi mật khẩu thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi đổi mật khẩu');
    }
  };

  // Unsupported Features (Báo lỗi rõ ràng để bổ sung sau)
  const handleDeleteAccount = async () => {
    try {
      await deleteAccountApi();
    } catch (err) {
      alert(`[Chưa có Backend API]:\n${err.message}`);
      showToast(err.message);
    }
  };

  const handleAdminExport = async () => {
    try {
      await exportDataApi();
    } catch (err) {
      alert(`[Chưa có Backend API]:\n${err.message}`);
      showToast(err.message);
    }
  };

  const handleAdminReset = async () => {
    try {
      await resetDatabaseApi();
    } catch (err) {
      alert(`[Chưa có Backend API]:\n${err.message}`);
      showToast(err.message);
    }
  };

  const handleAdminRevert = async (placeId) => {
    try {
      await revertPlaceApi(placeId);
    } catch (err) {
      alert(`[Chưa có Backend API]:\n${err.message}`);
      showToast(err.message);
    }
  };

  // Admin Place CRUD Handlers
  const handleAdminSavePlace = async (placeData) => {
    try {
      if (isAdminNewPlace) {
        await adminCreatePlaceApi({ ...placeData, city: selectedCity });
        showToast(`Đã tạo địa điểm "${placeData.name}" thành công!`);
      } else {
        await adminUpdatePlaceApi(placeData.id, placeData);
        showToast(`Đã cập nhật địa điểm "${placeData.name}" thành công!`);
      }
      setIsAdminModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Lỗi lưu địa điểm');
    }
  };

  const handleAdminDeletePlace = async (placeId) => {
    try {
      await adminDeletePlaceApi(placeId);
      showToast('Đã xóa địa điểm thành công!');
      setIsAdminModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Lỗi xóa địa điểm');
    }
  };

  return (
    <div className="geozone-app">
      {/* 1. Global Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        tripCount={cartItems.length}
        favCount={favorites.length}
        user={user}
        isUserMenuOpen={isUserMenuOpen}
        onToggleUserMenu={() => setIsUserMenuOpen(!isUserMenuOpen)}
        onOpenAuth={(tab) => {
          setAuthTab(tab);
          setAuthError('');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* 2. Main Page Views */}
      <main>
        {currentView === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectCity={(cityKey) => setSelectedCity(cityKey)}
          />
        )}

        {currentView === 'about' && (
          <AboutPage onNavigate={handleNavigate} />
        )}

        {currentView === 'explore' && (
          <ExplorePage
            mode={exploreMode}
            onSelectMode={setExploreMode}
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            cartItems={cartItems}
            onOpenCart={() => setIsCartModalOpen(true)}
            onToggleCart={handleToggleCart}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            isAdmin={user?.role?.toLowerCase() === 'admin'}
            onAdminAdd={() => {
              setAdminPlaceToEdit(null);
              setIsAdminNewPlace(true);
              setIsAdminModalOpen(true);
            }}
            onAdminEdit={(place) => {
              setAdminPlaceToEdit(place);
              setIsAdminNewPlace(false);
              setIsAdminModalOpen(true);
            }}
            onAdminExport={handleAdminExport}
            onAdminReset={handleAdminReset}
            onSavePlan={handleSaveGeneratedPlan}
            showToast={showToast}
          />
        )}

        {currentView === 'trips' && (
          <TripsPage
            trips={trips}
            isLoggedIn={!!user}
            onOpenAuth={(tab) => {
              setAuthTab(tab);
              setIsAuthModalOpen(true);
            }}
            onViewTrip={(trip) => setSelectedTripDetail(trip)}
            onDeleteTrip={handleDeleteTrip}
            onClearAllTrips={handleClearAllTrips}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'favs' && (
          <FavoritesPage
            favorites={favorites}
            isLoggedIn={!!user}
            selectedCity={selectedFavCityFilter}
            onSelectCity={setSelectedFavCityFilter}
            onOpenAuth={(tab) => {
              setAuthTab(tab);
              setIsAuthModalOpen(true);
            }}
            onViewPlace={(place) => {
              setSelectedCity(place.city || 'hue');
              handleNavigate('explore');
            }}
            onRemoveFavorite={handleRemoveFavorite}
            onClearAllFavorites={handleClearAllFavorites}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'account' && (
          <AccountPage
            user={user}
            stats={{
              tripsCount: trips.length,
              favsCount: favorites.length,
              joinedDate: 'Tháng 11, 2026'
            }}
            onUpdateProfile={handleUpdateProfile}
            onChangePassword={handleChangePassword}
            onDeleteAccount={handleDeleteAccount}
            onNavigate={handleNavigate}
            onOpenAuth={() => {
              setAuthTab('login');
              setIsAuthModalOpen(true);
            }}
          />
        )}
      </main>

      {/* 3. Global Modals & Dialogs */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authTab}
        onLogin={handleLogin}
        onRegister={handleRegister}
        errorMsg={authError}
      />

      <TripCartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        cartItems={cartItems}
        onRemoveItem={(id) => setCartItems(cartItems.filter((c) => c.id !== id))}
        onSaveTrip={handleSaveCartAsTrip}
        onCopyTrip={() => {
          navigator.clipboard?.writeText(cartItems.map((c) => c.name).join('\n'));
          showToast('Đã sao chép danh sách vào clipboard!');
        }}
        onClearTrip={() => setCartItems([])}
      />

      <TripDetailModal
        isOpen={!!selectedTripDetail}
        onClose={() => setSelectedTripDetail(null)}
        trip={selectedTripDetail}
        onCopyShareLink={(trip) => {
          navigator.clipboard?.writeText(window.location.origin + '#share=' + (trip.shareToken || trip.id));
          showToast('Đã sao chép liên kết chia sẻ!');
        }}
        onDeleteTrip={handleDeleteTrip}
      />

      <AdminPlaceModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        place={adminPlaceToEdit}
        isNew={isAdminNewPlace}
        zones={getCityZones(selectedCity)}
        onSave={handleAdminSavePlace}
        onRevert={(id) => handleAdminRevert(id)}
        onDelete={(id) => handleAdminDeletePlace(id)}
      />

      {/* 4. Global Toast Alert */}
      <Toast message={toastMsg} isVisible={isToastVisible} />

      {/* 5. Floating Bottom Back Button */}
      {currentView !== 'home' && (
        <BottomBack
          label="← Quay lại Trang chủ"
          onClick={() => handleNavigate('home')}
        />
      )}
    </div>
  );
}
