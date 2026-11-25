import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './styles/global.css';
import './styles/PlanManagement.css';
import { useToast } from './context/ToastContext.jsx';

// Layout & Common Components
import Navbar from './components/layout/Navbar';

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
import { SavePlanModal } from './components/saved/SavePlanModal.jsx';
import PlanDetailPage from './pages/PlanDetailPage.jsx';
import AdminPlaceModal from './components/modals/AdminPlaceModal';
import AdminLayout from './components/admin/AdminLayout.jsx';
import AdminOverviewPage from './pages/admin/AdminOverviewPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import AdminPlacesPage from './pages/admin/AdminPlacesPage.jsx';
import AdminZonesPage from './pages/admin/AdminZonesPage.jsx';
import AdminConfirmModal from './components/admin/AdminConfirmModal.jsx';

// Mock Data
import {
  CITIES,
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
  getMyPlans,
  deletePlan,
  updatePlan,
  getMyFavoritesApi,
  addFavoriteApi,
  removeFavoriteApi,
  AUTH_INVALIDATED_EVENT,
  AUTH_EXPIRED_EVENT,
  adminCreatePlaceApi,
  adminUpdatePlaceApi,
  adminDeletePlaceApi,
  deleteAccountApi,
  exportDataApi,
  resetDatabaseApi,
  revertPlaceApi
} from './services/api';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

function NotFoundPage() {
  return (
    <section className="gz-empty-state">
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn này không tồn tại hoặc đã được thay đổi.</p>
      <Link className="gz-empty-state-link" to="/">Về trang chủ</Link>
    </section>
  );
}

function ProtectedRoute({ user, isLoading, children }) {
  if (isLoading) return <section className="gz-empty-state"><p>Đang xác thực tài khoản…</p></section>;
  return user ? children : <Navigate to="/" replace />;
}

function AdminRoute({ user, isLoading, children }) {
  if (isLoading) return <section className="gz-empty-state"><p>Đang xác thực tài khoản…</p></section>;
  return String(user?.role || '').toUpperCase() === 'ADMIN'
    ? children
    : <Navigate to="/" replace />;
}

function getPathSegment(pathname, routePrefix) {
  const segment = pathname.slice(routePrefix.length).split('/')[0];
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthHydrating, setIsAuthHydrating] = useState(true);
  const [exploreMode, setExploreMode] = useState('explore'); // 'explore' | 'planner'
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [selectedCity, setSelectedCity] = useState('hue');

  // User & Auth State
  const [user, setUser] = useState(() => getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [authError, setAuthError] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Trips & Cart State
  const [trips, setTrips] = useState([]);
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [planToSave, setPlanToSave] = useState(null);
  const [isSavePlanModalOpen, setIsSavePlanModalOpen] = useState(false);
  const [savePlanSource, setSavePlanSource] = useState('planner');

  // Favorites State
  const [favorites, setFavorites] = useState([]);
  const [selectedFavCityFilter, setSelectedFavCityFilter] = useState('all');

  // Admin Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPlaceToEdit, setAdminPlaceToEdit] = useState(null);
  const [isAdminNewPlace, setIsAdminNewPlace] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [isConfirmationBusy, setIsConfirmationBusy] = useState(false);
  const hasShownAuthToast = useRef(false);

  const { showToast } = useToast();
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const currentView = (() => {
    if (isAdminRoute) return 'admin';
    if (location.pathname === '/about') return 'about';
    if (location.pathname === '/explore') return 'explore';
    if (location.pathname.startsWith('/my-trips')) return 'trips';
    if (location.pathname === '/favorites') return 'favs';
    if (location.pathname === '/profile') return 'account';
    return 'home';
  })();
  const isKnownRoute = ['/', '/about', '/explore', '/my-trips', '/favorites', '/profile', '/admin'].includes(location.pathname)
    || location.pathname.startsWith('/admin/')
    || location.pathname.startsWith('/my-trips/')
    || location.pathname.startsWith('/share/');
  const userKey = user ? String(user.id || user.email || 'authenticated-user') : null;
  const isAdminUser = String(user?.role || '').toUpperCase() === 'ADMIN';

  useEffect(() => {
    const clearAuthState = () => {
      setUser(null);
      setTrips([]);
      setFavorites([]);
      setIsCollectionsLoading(false);
      setIsUserMenuOpen(false);
      setIsAuthModalOpen(false);
      setPendingConfirmation(null);
      setIsAuthHydrating(false);
      if (!location.pathname.startsWith('/share/')) {
        navigate('/', { replace: true });
      }
    };

    const handleAuthInvalidated = () => {
      clearAuthState();
      if (!hasShownAuthToast.current) {
        hasShownAuthToast.current = true;
        showToast('Tài khoản của bạn đã bị vô hiệu hóa. Bạn đã được đăng xuất.', 'error');
      }
    };

    const handleAuthExpired = () => {
      clearAuthState();
      if (!hasShownAuthToast.current) {
        hasShownAuthToast.current = true;
        showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 'error');
      }
    };

    window.addEventListener(AUTH_INVALIDATED_EVENT, handleAuthInvalidated);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_INVALIDATED_EVENT, handleAuthInvalidated);
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [location.pathname, navigate, showToast]);

  // 1. Initial Load: Sync User, Plans, and Favorites from Backend
  useEffect(() => {
    const token = getToken();
    if (token) {
      getMeApi()
        .then((userData) => {
          if (userData) setUser(userData);
        })
        .catch((error) => {
          if (!getToken()) {
            setUser(null);
            return;
          }
          showToast(error.message || 'Không thể xác thực phiên đăng nhập. Vui lòng thử lại.', 'error');
        })
        .finally(() => setIsAuthHydrating(false));
    } else {
      setUser(null);
      setIsAuthHydrating(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isAuthHydrating) return undefined;
    if (!userKey) {
      setTrips([]);
      setFavorites([]);
      setIsCollectionsLoading(false);
      return undefined;
    }

    let isCurrent = true;
    setTrips([]);
    setFavorites([]);
    setIsCollectionsLoading(true);

    Promise.allSettled([getMyPlans(), getMyFavoritesApi()]).then((results) => {
      if (!isCurrent || !getToken()) return;

      const [plansResult, favoritesResult] = results;
      if (plansResult.status === 'fulfilled') {
        setTrips(Array.isArray(plansResult.value) ? plansResult.value : []);
      } else {
        setTrips([]);
        showToast(plansResult.reason?.message || 'Không thể tải chuyến đi của bạn.', 'error');
      }

      if (favoritesResult.status === 'fulfilled') {
        setFavorites(Array.isArray(favoritesResult.value) ? favoritesResult.value : []);
      } else {
        setFavorites([]);
        showToast(favoritesResult.reason?.message || 'Không thể tải địa điểm yêu thích.', 'error');
      }
    }).finally(() => {
      if (isCurrent) setIsCollectionsLoading(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [isAuthHydrating, userKey, showToast]);

  useEffect(() => {
    if (!isAuthHydrating && !user
      && (location.pathname === '/my-trips' || location.pathname.startsWith('/my-trips/')
        || ['/favorites', '/profile'].includes(location.pathname))) {
      showToast('Vui lòng đăng nhập để xem mục này');
      navigate('/', { replace: true });
    } else if (!isAuthHydrating && isAdminRoute && !isAdminUser) {
      showToast('Bạn không có quyền truy cập trang quản trị', 'error');
      navigate('/', { replace: true });
    }
  }, [isAuthHydrating, user, isAdminUser, isAdminRoute, location.pathname, navigate, showToast]);

  // Navigation Handler
  const handleNavigate = (view, options = {}) => {
    const paths = {
      home: '/',
      about: '/about',
      explore: '/explore',
      trips: '/my-trips',
      favs: '/favorites',
      account: '/profile',
      admin: '/admin'
    };
    if (options.mode) {
      setExploreMode(options.mode === 'plan' ? 'planner' : options.mode);
    }
    if (view === 'admin') setExploreMode('explore');
    navigate(paths[view] || '/');
  };

  // Auth Handlers
  const handleLogin = async (credentials) => {
    setAuthError('');
    try {
      const loggedInUser = await loginApi(credentials);
      hasShownAuthToast.current = false;
      setTrips([]);
      setFavorites([]);
      setIsCollectionsLoading(true);
      setUser(loggedInUser);
      setIsAuthModalOpen(false);
      if (planToSave) setIsSavePlanModalOpen(true);
      showToast(`Chào mừng ${loggedInUser.name || loggedInUser.username}!`);
    } catch (err) {
      setAuthError(err.message || 'Đăng nhập không thành công');
      showToast(err.message || 'Không thể đăng nhập. Vui lòng thử lại.', 'error');
    }
  };

  const handleRegister = async (data) => {
    setAuthError('');
    try {
      const newUser = await registerApi(data);
      hasShownAuthToast.current = false;
      setTrips([]);
      setFavorites([]);
      setIsCollectionsLoading(true);
      setUser(newUser);
      setIsAuthModalOpen(false);
      showToast(`Đăng ký tài khoản thành công!`);
    } catch (err) {
      setAuthError(err.message || 'Đăng ký không thành công');
      showToast(err.message || 'Không thể đăng ký. Vui lòng thử lại.', 'error');
    }
  };

  const handleLogout = async () => {
    await logoutApi();
    setTrips([]);
    setFavorites([]);
    setIsCollectionsLoading(false);
    setUser(null);
    showToast('Đã đăng xuất tài khoản.');
  };

  const requestConfirmation = (confirmation) => {
    setPendingConfirmation(confirmation);
  };

  const handleConfirmAction = async () => {
    if (!pendingConfirmation || isConfirmationBusy) return;
    setIsConfirmationBusy(true);
    try {
      await pendingConfirmation.onConfirm();
    } catch (error) {
      showToast(error.message || 'Không thể hoàn tất thao tác.', 'error');
    } finally {
      setIsConfirmationBusy(false);
      setPendingConfirmation(null);
    }
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

  const requestSavePlan = (plan, source = 'planner') => {
    if (!plan) return;
    setPlanToSave(plan);
    setSavePlanSource(source);
    setIsCartModalOpen(false);
    if (!user) {
      setAuthTab('login');
      setIsAuthModalOpen(true);
      showToast('Đăng nhập để lưu lịch trình vào tài khoản của bạn.', 'info');
      return;
    }
    setIsSavePlanModalOpen(true);
  };

  const handleSaveCartAsTrip = async () => {
    if (cartItems.length === 0) return;
    const currentCityConfig = CITIES[selectedCity] || CITIES.hue;
    const daysCount = Math.ceil(cartItems.length / 3);
    const newTripPayload = {
      title: `Khám phá ${currentCityConfig.name} ${daysCount} ngày`,
      city: selectedCity,
      cityName: currentCityConfig.name,
      totalDays: daysCount,
      totalBudget: 0,
      actualCost: cartItems.reduce((acc, p) => acc + (p.estimatedCost || p.cost || 0), 0),
      days: Array.from({ length: daysCount }, (_, index) => ({
        dayNumber: index + 1,
        title: `Khám phá ${currentCityConfig.name}`,
        totalCost: cartItems
          .slice(index * 3, (index + 1) * 3)
          .reduce((acc, place) => acc + (place.estimatedCost || place.cost || 0), 0),
        places: cartItems.slice(index * 3, (index + 1) * 3)
      }))
    };

    requestSavePlan(newTripPayload, 'cart');
  };

  const handleSavePlanSuccess = (savedTrip) => {
    setTrips((currentTrips) => [savedTrip, ...currentTrips]);
    if (savePlanSource === 'cart') setCartItems([]);
    setPlanToSave(null);
    showToast('Lưu lịch trình thành công!', 'success', {
      label: 'Xem chuyến đi',
      onClick: () => navigate(`/my-trips/${encodeURIComponent(savedTrip.id)}`)
    });
  };

  const handleSaveGeneratedPlan = (generatedPlan) => {
    requestSavePlan(generatedPlan, 'planner');
  };

  const handleUpdateSavedPlan = async (planId, changes) => {
    const updatedPlan = await updatePlan(planId, changes);
    setTrips((currentTrips) => currentTrips.map((trip) => (
      String(trip.id) === String(updatedPlan.id) ? updatedPlan : trip
    )));
    return updatedPlan;
  };

  const deleteTrip = async (tripId) => {
    try {
      await deletePlan(tripId);
      setTrips((currentTrips) => currentTrips.filter((trip) => String(trip.id) !== String(tripId)));
      showToast('Đã xóa chuyến đi thành công.');
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa chuyến đi', 'error');
    }
  };

  const handleDeleteTrip = (tripId) => {
    const trip = trips.find((item) => String(item.id) === String(tripId));
    requestConfirmation({
      title: 'Xóa chuyến đi này?',
      message: `Lịch trình "${trip?.title || trip?.name || 'Chuyến đi'}" sẽ bị xóa khỏi tài khoản và không thể khôi phục.`,
      confirmLabel: 'Xóa chuyến đi',
      onConfirm: () => deleteTrip(tripId)
    });
  };

  const handleClearAllTrips = () => {
    if (!trips.length) return;
    const savedTrips = [...trips];
    requestConfirmation({
      title: 'Xóa tất cả chuyến đi?',
      message: `Bạn sắp xóa ${savedTrips.length} chuyến đi đã lưu khỏi tài khoản. Hành động này không thể hoàn tác.`,
      confirmLabel: 'Xóa tất cả',
      onConfirm: async () => {
        const results = await Promise.allSettled(savedTrips.map((trip) => deletePlan(trip.id)));
        const failedIds = new Set(
          results.flatMap((result, index) => result.status === 'rejected' ? [String(savedTrips[index].id)] : [])
        );
        setTrips((currentTrips) => currentTrips.filter((trip) => failedIds.has(String(trip.id))));
        const failedCount = failedIds.size;
        if (failedCount) {
          showToast(`Đã xóa ${savedTrips.length - failedCount} chuyến đi; ${failedCount} mục chưa xóa được.`, 'error');
        } else {
          showToast('Đã xóa toàn bộ chuyến đi.');
        }
      }
    });
  };

  // Favorites Handlers
  const handleToggleFavorite = async (place) => {
    const exists = favorites.some((f) => f.id === place.id);
    if (exists) {
      try {
        await removeFavoriteApi(place.id);
        setFavorites((currentFavorites) => currentFavorites.filter((f) => f.id !== place.id));
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
      setFavorites((currentFavorites) => currentFavorites.filter((f) => f.id !== placeId));
      showToast('Đã xóa địa điểm khỏi mục yêu thích.');
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleClearAllFavorites = () => {
    if (!favorites.length) return;
    const savedFavorites = [...favorites];
    requestConfirmation({
      title: 'Xóa tất cả địa điểm yêu thích?',
      message: `Bạn sắp xóa ${savedFavorites.length} địa điểm khỏi danh sách yêu thích trên tài khoản. Hành động này không thể hoàn tác.`,
      confirmLabel: 'Xóa tất cả',
      onConfirm: async () => {
        const results = await Promise.allSettled(
          savedFavorites.map((place) => removeFavoriteApi(place.id))
        );
        const failedIds = new Set(
          results.flatMap((result, index) => result.status === 'rejected' ? [String(savedFavorites[index].id)] : [])
        );
        setFavorites((currentFavorites) =>
          currentFavorites.filter((place) => failedIds.has(String(place.id)))
        );
        const failedCount = failedIds.size;
        if (failedCount) {
          showToast(`Đã xóa ${savedFavorites.length - failedCount} địa điểm; ${failedCount} mục chưa xóa được.`, 'error');
        } else {
          showToast('Đã xóa toàn bộ địa điểm yêu thích.');
        }
      }
    });
  };

  // Profile Handlers
  const handleUpdateProfile = async (profileData) => {
    try {
      const updatedUser = await updateProfileApi(profileData);
      setUser({ ...user, ...updatedUser });
      showToast('Cập nhật thông tin thành công!');
      return true;
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật thông tin');
      return false;
    }
  };

  const handleChangePassword = async (passData) => {
    try {
      await changePasswordApi(passData);
      showToast('Đã đổi mật khẩu thành công!');
      return true;
    } catch (err) {
      showToast(err.message || 'Lỗi khi đổi mật khẩu');
      return false;
    }
  };

  // Unsupported Features (Báo lỗi rõ ràng để bổ sung sau)
  const handleDeleteAccount = async () => {
    try {
      await deleteAccountApi();
      await logoutApi();
      setTrips([]);
      setFavorites([]);
      setUser(null);
      navigate('/', { replace: true });
      showToast('Đã xóa tài khoản và đăng xuất.');
      return true;
    } catch (err) {
      showToast(`[Chưa có Backend API]: ${err.message}`, 'error');
      return false;
    }
  };

  const handleAdminExport = async () => {
    try {
      await exportDataApi();
    } catch (err) {
      showToast(`[Chưa có Backend API]: ${err.message}`, 'error');
    }
  };

  const handleAdminReset = () => {
    requestConfirmation({
      title: 'Đặt lại dữ liệu hệ thống?',
      message: 'Thao tác này có thể xóa hoặc khôi phục dữ liệu hệ thống. Chỉ tiếp tục nếu bạn đã chắc chắn.',
      confirmLabel: 'Đặt lại dữ liệu',
      onConfirm: async () => {
        try {
          await resetDatabaseApi();
        } catch (err) {
          showToast(`[Chưa có Backend API]: ${err.message}`, 'error');
        }
      }
    });
  };

  const handleAdminRevert = (placeId) => {
    requestConfirmation({
      title: 'Khôi phục địa điểm?',
      message: 'Các thay đổi hiện tại của địa điểm sẽ được thay thế bằng dữ liệu gốc.',
      confirmLabel: 'Khôi phục',
      onConfirm: async () => {
        try {
          await revertPlaceApi(placeId);
        } catch (err) {
          showToast(`[Chưa có Backend API]: ${err.message}`, 'error');
        }
      }
    });
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

  const handleAdminDeletePlace = (placeId) => {
    const placeName = adminPlaceToEdit?.name || 'địa điểm này';
    requestConfirmation({
      title: 'Xóa địa điểm?',
      message: `"${placeName}" sẽ bị xóa khỏi danh mục và không thể khôi phục.`,
      confirmLabel: 'Xóa địa điểm',
      onConfirm: async () => {
        try {
          await adminDeletePlaceApi(placeId);
          showToast('Đã xóa địa điểm thành công!');
          setIsAdminModalOpen(false);
        } catch (err) {
          showToast(err.message || 'Lỗi xóa địa điểm', 'error');
        }
      }
    });
  };

  const handleClearCart = () => {
    if (!cartItems.length) return;
    requestConfirmation({
      title: 'Xóa lịch trình tạm?',
      message: `Danh sách ${cartItems.length} địa điểm hiện tại sẽ được xóa khỏi lịch trình chưa lưu.`,
      confirmLabel: 'Xóa lịch trình',
      onConfirm: () => setCartItems([])
    });
  };

  const explorePage = (
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
      isAdmin={isAdminUser}
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
      generatedPlan={generatedPlan}
      onGeneratedPlanChange={setGeneratedPlan}
      showToast={showToast}
    />
  );

  return (
    <div className="geozone-app">
      <ScrollToTop />
      {/* 1. Global Navigation Bar */}
      {!isAdminRoute && (
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          tripCount={cartItems.length}
          favCount={favorites.length}
          user={user}
          isUserMenuOpen={isUserMenuOpen}
          onToggleUserMenu={() => setIsUserMenuOpen((isOpen) => !isOpen)}
          onOpenAuth={(tab) => {
            setAuthTab(tab);
            setAuthError('');
            setIsAuthModalOpen(true);
          }}
          onLogout={handleLogout}
        />
      )}

      {/* 2. Main Page Views */}
      <main key={location.pathname} className="gz-route-transition">
        {!isKnownRoute && <NotFoundPage />}
        {location.pathname === '/' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectCity={(cityKey) => setSelectedCity(cityKey)}
          />
        )}

        {currentView === 'about' && (
          <AboutPage onNavigate={handleNavigate} />
        )}

        {currentView === 'explore' && (
          explorePage
        )}

        {currentView === 'admin' && (
          <AdminRoute user={user} isLoading={isAuthHydrating}>
            <AdminLayout user={user} onLogout={handleLogout}>
              {location.pathname === '/admin' && <AdminOverviewPage showToast={showToast} />}
              {location.pathname === '/admin/users' && <AdminUsersPage user={user} showToast={showToast} />}
              {location.pathname === '/admin/places' && <AdminPlacesPage showToast={showToast} />}
              {location.pathname === '/admin/zones' && <AdminZonesPage showToast={showToast} />}
              {!['/admin', '/admin/users', '/admin/places', '/admin/zones'].includes(location.pathname) && (
                <Navigate to="/admin" replace />
              )}
            </AdminLayout>
          </AdminRoute>
        )}

        {currentView === 'trips' && location.pathname === '/my-trips' && (
          <ProtectedRoute user={user} isLoading={isAuthHydrating}>
            <TripsPage
            trips={trips}
            isLoading={isCollectionsLoading}
            isLoggedIn={!!user}
            onOpenAuth={(tab) => {
              setAuthTab(tab);
              setIsAuthModalOpen(true);
            }}
            onViewTrip={(trip) => navigate(`/my-trips/${encodeURIComponent(trip.id)}`)}
            onDeleteTrip={handleDeleteTrip}
            onRenameTrip={(tripId, title) => handleUpdateSavedPlan(tripId, { title })}
            onToggleTripShare={(tripId, is_public) => handleUpdateSavedPlan(tripId, { is_public })}
            onClearAllTrips={handleClearAllTrips}
            onNavigate={handleNavigate}
            />
          </ProtectedRoute>
        )}

        {currentView === 'favs' && location.pathname === '/favorites' && (
          <ProtectedRoute user={user} isLoading={isAuthHydrating}>
            <FavoritesPage
            favorites={favorites}
            isLoading={isCollectionsLoading}
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
          </ProtectedRoute>
        )}

        {currentView === 'account' && location.pathname === '/profile' && (
          <ProtectedRoute user={user} isLoading={isAuthHydrating}>
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
          </ProtectedRoute>
        )}

        {location.pathname.startsWith('/my-trips/') && (
          <ProtectedRoute user={user} isLoading={isAuthHydrating}>
            <PlanDetailPage
              planId={getPathSegment(location.pathname, '/my-trips/')}
              onPlanDeleted={(planId) => {
                setTrips((currentTrips) => currentTrips.filter((trip) => String(trip.id) !== String(planId)));
              }}
            />
          </ProtectedRoute>
        )}
        {location.pathname.startsWith('/share/') && (
          <PlanDetailPage shared shareToken={getPathSegment(location.pathname, '/share/')} />
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
        onClearTrip={handleClearCart}
      />

      <SavePlanModal
        isOpen={isSavePlanModalOpen}
        onClose={() => setIsSavePlanModalOpen(false)}
        currentPlan={planToSave}
        onSuccess={handleSavePlanSuccess}
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

      {pendingConfirmation && (
        <AdminConfirmModal
          title={pendingConfirmation.title}
          message={pendingConfirmation.message}
          confirmLabel={pendingConfirmation.confirmLabel}
          isBusy={isConfirmationBusy}
          onCancel={() => {
            if (!isConfirmationBusy) setPendingConfirmation(null);
          }}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}
