import React, { useState } from 'react';
import '../styles/Explore.css';
import '../styles/Planner.css';
import ExploreTopBar from '../components/explore/ExploreTopBar';
import FilterPanel from '../components/explore/FilterPanel';
import PlaceCard from '../components/explore/PlaceCard';
import ExploreMap from '../components/explore/ExploreMap';
import PlannerSidebar from '../components/planner/PlannerSidebar';
import PlannerResults from '../components/planner/PlannerResults';
import SwapModal from '../components/planner/SwapModal';
import { CITIES, getPlacesByCity, getCityZones } from '../data/mockData';
import { generateItineraryApi, swapPlaceApi } from '../services/api';

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

  // Planner parameters
  const [daysCount, setDaysCount] = useState(2);
  const [budget, setBudget] = useState(1000000);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  // Dynamic Swap State
  const [swapState, setSwapState] = useState({
    isOpen: false,
    dayIndex: 0,
    placeIndex: 0,
    place: null
  });
  const [isSwapping, setIsSwapping] = useState(false);

  const cityPlaces = getPlacesByCity(selectedCity);
  const cityZones = getCityZones(selectedCity);
  const cityConfig = CITIES[selectedCity] || CITIES.hue;

  // Filter place cards
  const filteredPlaces = cityPlaces.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchAddr = (p.address || '').toLowerCase().includes(q);
      const matchZone = (p.zoneName || '').toLowerCase().includes(q);
      if (!matchName && !matchAddr && !matchZone) return false;
    }

    if (selectedZone && p.zoneCode !== selectedZone) {
      return false;
    }

    const maxCost = parseFloat(selectedCost);
    const placeCost = p.estimatedCost ?? p.cost ?? 0;
    if (placeCost > maxCost) {
      return false;
    }

    if (selectedTags.length > 0) {
      const hasAllTags = selectedTags.some((t) => (p.tags || []).includes(t));
      if (!hasAllTags) return false;
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

  // Sorting
  filteredPlaces.sort((a, b) => {
    if (selectedSort === 'pop') return (b.popularity || 0) - (a.popularity || 0);
    if (selectedSort === 'costAsc') return (a.estimatedCost || 0) - (b.estimatedCost || 0);
    if (selectedSort === 'durAsc') return (a.duration || 60) - (b.duration || 60);
    if (selectedSort === 'name') return (a.name || '').localeCompare(b.name || '');
    return 0;
  });

  // Tag counts
  const tagCounts = {};
  cityPlaces.forEach((p) => {
    (p.tags || []).forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

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

  // Generate Plan via Service Layer
  const handleGeneratePlan = async () => {
    setIsPlanning(true);
    try {
      const planResult = await generateItineraryApi({
        city: selectedCity,
        days: daysCount,
        budget,
        tags: selectedPreferences
      });
      setGeneratedPlan(planResult);
      showToast('Đã tạo và tối ưu lịch trình thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi tạo lịch trình');
    } finally {
      setIsPlanning(false);
    }
  };

  // Open Swap Modal
  const handleOpenSwapModal = (dayIndex, placeIndex, place) => {
    setSwapState({
      isOpen: true,
      dayIndex,
      placeIndex,
      place
    });
  };

  // Confirm Swap Place
  const handleConfirmSwap = async (newPlace) => {
    if (!generatedPlan || !swapState.place) return;
    setIsSwapping(true);
    try {
      await swapPlaceApi({
        currentPlaceId: swapState.place.id,
        newPlaceId: newPlace.id,
        dayNumber: swapState.dayIndex + 1,
        zoneCode: swapState.place.zoneCode,
        city: selectedCity
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
          totalCost: updatedPlaces.reduce((sum, p) => sum + (p.estimatedCost || 0), 0)
        };
      });

      const updatedPlan = {
        ...generatedPlan,
        days: updatedDays,
        totalCost: updatedDays.reduce((sum, d) => sum + d.totalCost, 0)
      };

      setGeneratedPlan(updatedPlan);
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

  // Alternatives in same zone for Swap Modal
  const availableAlternatives = swapState.place
    ? cityPlaces.filter(
        (p) =>
          p.id !== swapState.place.id &&
          (p.zoneCode === swapState.place.zoneCode || !swapState.place.zoneCode)
      )
    : [];

  return (
    <div className="gz-view gz-explore on" data-view="explore">
      {/* Top Bar Header */}
      <ExploreTopBar
        mode={mode}
        onSelectMode={onSelectMode}
        selectedCity={selectedCity}
        onSelectCity={onSelectCity}
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
            {filteredPlaces.length > 0 ? (
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
              <p style={{ textAlign: 'center', color: '#64748b', padding: '40px 16px' }}>
                Không tìm thấy địa điểm nào phù hợp với bộ lọc hiện tại.
              </p>
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
          onCityChange={onSelectCity}
          daysCount={daysCount}
          onDaysChange={setDaysCount}
          budget={budget}
          onBudgetChange={setBudget}
          selectedPreferences={selectedPreferences}
          onTogglePreference={handleTogglePreference}
          onSubmit={handleGeneratePlan}
          isLoading={isPlanning}
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
        availableAlternatives={availableAlternatives}
        onConfirmSwap={handleConfirmSwap}
        isLoading={isSwapping}
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
