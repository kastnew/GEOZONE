import React, { useMemo, useState, useEffect } from 'react';
import '../styles/Explore.css';
import '../styles/Planner.css';
import ExploreTopBar from '../components/explore/ExploreTopBar';
import FilterPanel from '../components/explore/FilterPanel';
import PlaceCard from '../components/explore/PlaceCard';
import ExploreMap from '../components/explore/ExploreMap';
import PlannerSidebar from '../components/planner/PlannerSidebar';
import PlannerResults from '../components/planner/PlannerResults';
import SwapModal from '../components/planner/SwapModal';
import { CITIES, getCityZones } from '../data/mockData';
import { generateItineraryApi, getPlacesApi, swapPlaceApi, getSwapSuggestionsApi } from '../services/api';

function getDisplayZoneCode(code) {
  return String(code || '').replace(/^(?:HUE|NINHBINH)-/i, '');
}

export default function ExplorePage({
  mode = 'explore',
  onSelectMode = () => {},
  selectedCity = 'hue',
  onSelectCity = () => {},
  cartItems = [],
  onOpenCart = () => {},
  onToggleCart = () => {},
  favorites = [],
  onToggleFavorite = () => {},
  isAdmin = false,
  onAdminAdd = () => {},
  onAdminEdit = () => {},
  onAdminExport = () => {},
  onAdminReset = () => {},
  onSavePlan = () => {},
  generatedPlan = null,
  onGeneratedPlanChange = () => {},
  showToast = () => {}
}) {
  // Local exploration filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedCost, setSelectedCost] = useState('1e9');
  const [selectedSort, setSelectedSort] = useState('pop');
  const [isOpenOnly, setIsOpenOnly] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'map'
  const [cityPlaces, setCityPlaces] = useState([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);
  const [placesError, setPlacesError] = useState('');
  const [placesReloadKey, setPlacesReloadKey] = useState(0);

  // Planner parameters
  const [daysCount, setDaysCount] = useState(2);
  const [budget, setBudget] = useState(1000000);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [isPlanning, setIsPlanning] = useState(false);

  // Khi đổi thành phố, xóa lịch trình cũ của thành phố trước để tránh hiển thị nhầm
  useEffect(() => {
    if (generatedPlan && generatedPlan.city && generatedPlan.city !== selectedCity) {
      setGeneratedPlan(null);
      setSwapState({ isOpen: false, dayIndex: 0, placeIndex: 0, place: null });
    }
  }, [selectedCity]);

  // Dynamic Swap State
  const [swapState, setSwapState] = useState({
    isOpen: false,
    dayIndex: 0,
    placeIndex: 0,
    place: null
  });
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuggestions, setSwapSuggestions] = useState([]);
  const [isLoadingSwapSuggestions, setIsLoadingSwapSuggestions] = useState(false);

  const cityZones = getCityZones(selectedCity);
  const cityConfig = CITIES[selectedCity] || CITIES.hue;

  useEffect(() => {
    let active = true;
    setIsLoadingPlaces(true);
    setPlacesError('');
    setCityPlaces([]);
    setSelectedPlace(null);

    getPlacesApi({ city: cityConfig.api }).then((places) => {
      if (!active) return;
      if (!Array.isArray(places)) throw new Error('Dữ liệu địa điểm từ máy chủ không hợp lệ.');
      setCityPlaces(places.map((place) => ({
        ...place,
        id: Number(place.id),
        city: selectedCity,
        zoneDbCode: place.zoneCode,
        zoneCode: getDisplayZoneCode(place.zoneCode),
        estimatedCost: Number(place.estimatedCost ?? 0),
        tags: Array.isArray(place.tags) ? place.tags : []
      })));
    }).catch((error) => {
      if (!active) return;
      setPlacesError(error.message || 'Không thể tải địa điểm từ máy chủ.');
      setCityPlaces([]);
    }).finally(() => {
      if (active) setIsLoadingPlaces(false);
    });

    return () => {
      active = false;
    };
  }, [selectedCity, cityConfig.api, placesReloadKey]);

  // Filter place cards
  const filteredPlaces = useMemo(() => {
    const filtered = cityPlaces.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchAddr = (p.address || '').toLowerCase().includes(q);
        const matchZone = (p.zoneName || '').toLowerCase().includes(q);
        if (!matchName && !matchAddr && !matchZone) return false;
      }

      if (selectedZone && p.zoneCode !== selectedZone) return false;

      const maxCost = parseFloat(selectedCost);
      const placeCost = p.estimatedCost ?? p.cost ?? 0;
      if (placeCost > maxCost) return false;

      if (selectedTags.length > 0 && !selectedTags.some((tag) => (p.tags || []).includes(tag))) {
        return false;
      }

      if (isOpenOnly && p.openingTime && p.closingTime) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const [openH, openM] = p.openingTime.split(':').map(Number);
        const [closeH, closeM] = p.closingTime.split(':').map(Number);
        const openMins = openH * 60 + openM;
        const closeMins = closeH * 60 + closeM;
        if (currentMins < openMins || currentMins > closeMins) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      if (selectedSort === 'pop') return (b.popularity || 0) - (a.popularity || 0);
      if (selectedSort === 'costAsc') return (a.estimatedCost || 0) - (b.estimatedCost || 0);
      if (selectedSort === 'durAsc') return (a.duration || 60) - (b.duration || 60);
      if (selectedSort === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
    return filtered;
  }, [cityPlaces, searchQuery, selectedZone, selectedCost, selectedTags, isOpenOnly, selectedSort]);

  // Tag counts
  const tagCounts = {};
  cityPlaces.forEach((p) => {
    (p.tags || []).forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const clearExploreFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedZone('');
    setSelectedCost('1e9');
    setSelectedSort('pop');
    setIsOpenOnly(false);
  };

  const handleCityChange = (cityKey) => {
    setSelectedPlace(null);
    setSelectedZone('');
    setSelectedTags([]);
    onSelectCity(cityKey);
  };

  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleTogglePreference = (tag) => {
    if (selectedPreferences.includes(tag)) {
      setSelectedPreferences(selectedPreferences.filter((t) => t !== tag));
    } else {
      setSelectedPreferences([...selectedPreferences, tag]);
    }
  };

  // Lọc các địa điểm trong Chuyến đi (cartItems) thuộc thành phố đang chọn để ép phải có trong lịch trình
  const cityCartItems = cartItems.filter((item) => {
    const itemCity = String(item.city || '').trim().toLowerCase();
    return (
      !itemCity ||
      itemCity === selectedCity.toLowerCase() ||
      itemCity === String(cityConfig.api || '').toLowerCase() ||
      cityPlaces.some((cp) => cp.id === item.id)
    );
  });

  // Generate Plan via Service Layer
  const handleGeneratePlan = async () => {
    setIsPlanning(true);
    try {
      const planResult = await generateItineraryApi({
        city: selectedCity,
        days: daysCount,
        budget,
        tags: selectedPreferences,
        mustVisitIds: cityCartItems.map((p) => Number(p.id)).filter(Number.isFinite)
      });
      onGeneratedPlanChange(planResult);
      showToast('Đã tạo và tối ưu lịch trình thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi tạo lịch trình');
    } finally {
      setIsPlanning(false);
    }
  };

  // Open Swap Modal & gọi trực tiếp Backend dynamicSwapEngine.js để lấy Top gợi ý chuẩn
  const handleOpenSwapModal = async (dayIndex, placeIndex, place) => {
    setSwapState({
      isOpen: true,
      dayIndex,
      placeIndex,
      place
    });
    setSwapSuggestions([]);
    setIsLoadingSwapSuggestions(true);

    try {
      const allPlannedIds = (generatedPlan?.days || []).flatMap((d) =>
        (d.places || []).map((p) => Number(p.id ?? p.placeId))
      );
      const totalB = Number(generatedPlan?.totalBudget ?? budget) || 1000000;
      const curCost = (generatedPlan?.days || []).reduce(
        (sum, d) => sum + (d.places || []).reduce((s, p) => s + Number(p.estimatedCost ?? p.cost ?? 0), 0),
        0
      );
      const oldCost = Number(place.estimatedCost ?? place.cost ?? 0);
      const maxSwapBudget = Math.max(0, totalB - (curCost - oldCost));

      const targetDay = generatedPlan?.days?.[dayIndex];
      const dayMinutes = (targetDay?.places || []).reduce(
        (s, p) => s + (Number(p.duration) || 60) + (Number(p.travelTimeFromPrev) || 0),
        0
      );
      const maxDur = (Number(place.duration) || 60) + Math.max(0, 480 - dayMinutes);
      const slotStart = place.startTime || (place.time ? String(place.time).split('-')[0].trim() : undefined);

      const res = await getSwapSuggestionsApi({
        currentPlaceId: place.id ?? place.placeId,
        city: selectedCity,
        dayNumber: dayIndex + 1,
        excludedPlaceIds: allPlannedIds,
        remainingBudget: maxSwapBudget,
        slotStartTime: slotStart,
        maxDurationAllowed: maxDur,
        userPreferences: selectedPreferences
      });

      if (res && Array.isArray(res.suggestions) && res.suggestions.length > 0) {
        setSwapSuggestions(res.suggestions);
      } else {
        setSwapSuggestions([]);
      }
    } catch {
      setSwapSuggestions([]);
    } finally {
      setIsLoadingSwapSuggestions(false);
    }
  };

  // Tính ngân sách tối đa cho phép đối với địa điểm thay thế (không làm tổng chi phí vượt ngân sách)
  const tripTotalBudget = Number(generatedPlan?.totalBudget ?? budget) || 1000000;
  const currentTripCost = (generatedPlan?.days || []).reduce(
    (sum, d) => sum + (d.places || []).reduce((s, p) => s + Number(p.estimatedCost ?? p.cost ?? 0), 0),
    0
  );
  const oldPlaceCost = Number(swapState.place?.estimatedCost ?? swapState.place?.cost ?? 0);
  const maxAllowedSwapCost = Math.max(0, tripTotalBudget - (currentTripCost - oldPlaceCost));

  // Confirm Swap Place
  const handleConfirmSwap = async (newPlace) => {
    if (!generatedPlan || !swapState.place) return;
    const newCost = Number(newPlace.estimatedCost ?? newPlace.cost ?? 0);
    if (newCost > maxAllowedSwapCost) {
      showToast(`Không thể đổi: "${newPlace.name}" sẽ làm tổng chi phí vượt ngân sách!`);
      return;
    }

    setIsSwapping(true);
    try {
      await swapPlaceApi({
        currentPlaceId: swapState.place.id,
        newPlaceId: newPlace.id,
        dayNumber: swapState.dayIndex + 1,
        zoneCode: swapState.place.zoneDbCode || swapState.place.zoneCode,
        city: selectedCity,
        excludedPlaceIds: Array.from(plannedPlaceIds),
        remainingBudget: maxAllowedSwapCost
      });

      // Update local state immutably
      const updatedDays = generatedPlan.days.map((day, dIdx) => {
        if (dIdx !== swapState.dayIndex) return day;
        const updatedPlaces = day.places.map((p, pIdx) => {
          if (pIdx !== swapState.placeIndex) return p;
          return {
            ...newPlace,
            time: p.time || '09:00 - 11:00'
          };
        });
        return {
          ...day,
          places: updatedPlaces,
          totalCost: updatedPlaces.reduce((sum, p) => sum + Number(p.estimatedCost ?? p.cost ?? 0), 0)
        };
      });

      const newTotalCost = updatedDays.reduce((sum, d) => sum + d.totalCost, 0);
      const updatedPlan = {
        ...generatedPlan,
        days: updatedDays,
        totalCost: newTotalCost,
        actualCost: newTotalCost
      };

      onGeneratedPlanChange(updatedPlan);
      setSwapState({ isOpen: false, dayIndex: 0, placeIndex: 0, place: null });
      showToast(`Đã đổi sang "${newPlace.name}"!`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi hoán đổi địa điểm');
    } finally {
      setIsSwapping(false);
    }
  };

  const isFav = (placeId) => favorites.some((f) => f.id === placeId);
  const isInCart = (placeId) => cartItems.some((c) => c.id === placeId);

  // Thu thập toàn bộ ID địa điểm đang có trong lịch trình (mọi ngày) để không cho trùng khi đổi
  const plannedPlaceIds = new Set(
    (generatedPlan?.days || []).flatMap((d) =>
      (d.places || []).map((p) => p.id ?? p.placeId)
    )
  );

  // Tính khoảng cách GPS (km) giữa 2 điểm để ưu tiên gợi ý các điểm gần nhất
  const calcDistKm = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 99;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
  };

  // Danh sách địa điểm thay thế: không trùng lịch trình, vừa ngân sách còn lại, sắp xếp theo độ gần GPS
  const availableAlternatives = swapState.place
    ? cityPlaces
        .filter((p) => {
          const pCost = Number(p.estimatedCost ?? p.cost ?? 0);
          return (
            !plannedPlaceIds.has(p.id) &&
            p.id !== (swapState.place.id ?? swapState.place.placeId) &&
            pCost <= maxAllowedSwapCost
          );
        })
        .map((p) => ({
          ...p,
          distanceKm: calcDistKm(swapState.place.latitude, swapState.place.longitude, p.latitude, p.longitude)
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
    : [];

  return (
    <div className="gz-view gz-explore on" data-view="explore">
      {/* Top Bar Header */}
      <ExploreTopBar
        mode={mode}
        onSelectMode={onSelectMode}
        selectedCity={selectedCity}
        onSelectCity={handleCityChange}
        cartCount={cartItems.length}
        onOpenCart={onOpenCart}
      />

      {/* Mode 1: Khám phá */}
      <main className="layout" id="layout" hidden={mode !== 'explore'}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <FilterPanel
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTags={selectedTags}
            onToggleTag={handleToggleTag}
            onClearTags={() => setSelectedTags([])}
            selectedZone={selectedZone}
            onZoneChange={setSelectedZone}
            zones={cityZones}
            selectedCost={selectedCost}
            onCostChange={setSelectedCost}
            selectedSort={selectedSort}
            onSortChange={setSelectedSort}
            isOpenOnly={isOpenOnly}
            onOpenOnlyChange={setIsOpenOnly}
            totalCount={cityPlaces.length}
            filteredCount={filteredPlaces.length}
            tagCounts={tagCounts}
            isAdmin={isAdmin}
            onAdminAdd={onAdminAdd}
            onAdminExport={onAdminExport}
            onAdminReset={onAdminReset}
          />

          <div className="cards" id="list">
            {isLoadingPlaces ? (
              <div className="gz-empty-state" role="status" aria-live="polite">
                <p>Đang tải địa điểm từ cơ sở dữ liệu…</p>
              </div>
            ) : placesError ? (
              <div className="gz-empty-state" role="alert">
                <p>{placesError}</p>
                <button type="button" onClick={() => setPlacesReloadKey((value) => value + 1)}>
                  Thử tải lại
                </button>
              </div>
            ) : filteredPlaces.length > 0 ? (
              filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  isSelected={selectedPlace && selectedPlace.id === place.id}
                  isInCart={isInCart(place.id)}
                  isFavorite={isFav(place.id)}
                  isAdmin={isAdmin}
                  onSelect={(p) => setSelectedPlace(p)}
                  onToggleCart={onToggleCart}
                  onToggleFavorite={onToggleFavorite}
                  onEdit={onAdminEdit}
                />
              ))
            ) : (
              <div className="gz-empty-state">
                <p>Không tìm thấy địa điểm phù hợp.</p>
                <button type="button" onClick={clearExploreFilters}>Xóa bộ lọc</button>
              </div>
            )}
          </div>
        </div>

        {/* Explore Leaflet Map */}
        <ExploreMap
          cityConfig={cityConfig}
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onSelectPlace={setSelectedPlace}
          onToggleCart={onToggleCart}
          cartItems={cartItems}
        />
      </main>

      {/* Mode 2: Lập lịch trình AI */}
      <main className="planner" id="planner" hidden={mode !== 'planner'}>
        <PlannerSidebar
          selectedCity={selectedCity}
          onCityChange={handleCityChange}
          daysCount={daysCount}
          onDaysChange={setDaysCount}
          budget={budget}
          onBudgetChange={setBudget}
          selectedPreferences={selectedPreferences}
          onTogglePreference={handleTogglePreference}
          onClearPreferences={() => setSelectedPreferences([])}
          onSubmit={handleGeneratePlan}
          isLoading={isPlanning}
          pinnedCount={cityCartItems.length}
        />

        <PlannerResults
          plan={generatedPlan}
          isLoading={isPlanning}
          onSavePlan={() => onSavePlan(generatedPlan)}
          onOpenSwap={handleOpenSwapModal}
          onSelectPlace={setSelectedPlace}
        />
      </main>

      {/* Dynamic Swap Place Modal */}
      <SwapModal
        isOpen={swapState.isOpen}
        onClose={() => setSwapState({ isOpen: false, dayIndex: 0, placeIndex: 0, place: null })}
        currentPlace={swapState.place}
        dayNumber={swapState.dayIndex + 1}
        availableAlternatives={swapSuggestions.length > 0 ? swapSuggestions : availableAlternatives}
        onConfirmSwap={handleConfirmSwap}
        isLoading={isSwapping}
        isLoadingSuggestions={isLoadingSwapSuggestions}
      />

      {/* Mobile View Toggle */}
      <div className="viewtoggle" role="group" aria-label="Chế độ xem">
        <button
          type="button"
          data-v="list"
          aria-pressed={mobileView === 'list'}
          onClick={() => setMobileView('list')}
        >
          Danh sách
        </button>
        <button
          type="button"
          data-v="map"
          aria-pressed={mobileView === 'map'}
          onClick={() => setMobileView('map')}
        >
          Bản đồ
        </button>
      </div>
    </div>
  );
}
