/**
 * GeoZone AI - Mock Travel Data & City Catalog
 * Extracted from monolithic frontend/public/geozone1/index.html
 */

import huePlaces from './hue_places.json';
import danangPlaces from './danang_places.json';
import hanoiPlaces from './hanoi_places.json';
import halongPlaces from './halong_places.json';
import ninhbinhPlaces from './ninhbinh_places.json';

// City Catalog Configuration
export const CITIES = {
  hue: {
    key: 'hue',
    name: 'Huế',
    api: 'Hue',
    file: 'data/hue_places.json',
    accent: '#6a4a9c',
    center: [16.4637, 107.5909],
    sub: 'Cố đô, sông Hương, lăng tẩm và đầm phá',
    hero: [
      'Gate of Noon, Imperial City, Huế (8104939291).jpg',
      'Imperial City, Hue, Vietnam (7073506027).jpg',
      'Ngomon2.jpg'
    ]
  },
  danang: {
    key: 'danang',
    name: 'Đà Nẵng',
    api: 'Da Nang',
    file: 'data/danang_places.json',
    accent: '#0d6f9c',
    center: [16.0544, 108.2022],
    sub: 'Biển Mỹ Khê, Sơn Trà, Ngũ Hành Sơn và Bà Nà',
    hero: []
  },
  hanoi: {
    key: 'hanoi',
    name: 'Hà Nội',
    api: 'Ha Noi',
    file: 'data/hanoi_places.json',
    accent: '#b3472f',
    center: [21.0285, 105.8542],
    sub: 'Phố cổ, Hồ Gươm, Văn Miếu, Sơn Tây và Ba Vì',
    hero: [
      'Turtle Tower, Hoan Kiem Lake, Hanoi (3531374428).jpg',
      'Hoan kiem hanoi 1999.jpg'
    ]
  },
  halong: {
    key: 'halong',
    name: 'Hạ Long',
    api: 'Ha Long',
    file: 'data/halong_places.json',
    accent: '#0a7f8c',
    center: [20.9500, 107.0700],
    sub: 'Vịnh Hạ Long, Bãi Cháy, Hòn Gai và đảo Tuần Châu',
    hero: [
      'Ha Long Bay with boats.jpg',
      'Ha Long Bay, Vietnam, Rock formations.jpg',
      'Boats in Ha Long bay.jpg'
    ]
  },
  ninhbinh: {
    key: 'ninhbinh',
    name: 'Ninh Bình',
    api: 'NinhBinh',
    file: 'data/ninhbinh_places.json',
    accent: '#2c7a58',
    center: [20.2506, 105.9745],
    sub: 'Tràng An, Tam Cốc, Cố đô Hoa Lư và Cúc Phương',
    hero: [
      'Vietnam, Ninh Binh, Limestone peaks.jpg',
      'Vietnam, Ninh Binh, Limestone mountains, panoramic view from above.jpg',
      'Tam Coc by Tuan Mai "007" (8888350545).jpg'
    ]
  }
};

// Activity & Preference Tags Taxonomy
export const TAGS = {
  food: 'Ẩm thực',
  culture: 'Văn hóa',
  nature: 'Thiên nhiên',
  sightseeing: 'Tham quan',
  nightlife: 'Về đêm',
  adventure: 'Phiêu lưu',
  beach: 'Biển',
  history: 'Lịch sử',
  shopping: 'Mua sắm'
};

// Places indexed by City Key (Total 271 places)
export const PLACES_BY_CITY = {
  hue: huePlaces,
  danang: danangPlaces,
  hanoi: hanoiPlaces,
  halong: halongPlaces,
  ninhbinh: ninhbinhPlaces
};

// Flattened collection of all places
export const ALL_PLACES = [
  ...huePlaces,
  ...danangPlaces,
  ...hanoiPlaces,
  ...halongPlaces,
  ...ninhbinhPlaces
];

// Zones grouped by City
export const ZONES_BY_CITY = {
  hue: [
    { code: 'Z1', name: 'Kinh Thành & Bắc Sông Hương' },
    { code: 'Z2', name: 'Trung tâm Nam Sông Hương' },
    { code: 'Z3', name: 'Cụm Lăng Tẩm & Đồi Cảnh Quan' },
    { code: 'Z4', name: 'Đầm Phá Tam Giang & Biển Thuận An' },
    { code: 'Z5', name: 'Sinh Thái Bạch Mã & Vịnh Lăng Cô' }
  ],
  danang: [
    { code: 'Z1', name: 'Trung tâm Hải Châu' },
    { code: 'Z2', name: 'Ven biển Mỹ Khê - Sơn Trà' },
    { code: 'Z3', name: 'Bán đảo Sơn Trà' },
    { code: 'Z4', name: 'Khu vực Ngũ Hành Sơn' },
    { code: 'Z5', name: 'Ngoại ô Hòa Vang - Bà Nà' }
  ],
  hanoi: [
    { code: 'HN1', name: 'Trung tâm Hà Nội' },
    { code: 'HN2', name: 'Khu vực Sơn Tây - Ba Vì' },
    { code: 'HN3', name: 'Khu vực Hương Sơn - Quan Sơn' },
    { code: 'HN4', name: 'Khu vực Đền Sóc - Hồ Đồng Quan' },
    { code: 'HN5', name: 'Khu vực Vân Trì - Cổ Loa' },
    { code: 'HN6', name: 'Khu vực Hà Đông' }
  ],
  halong: [
    { code: 'HL1', name: 'Khu Bãi Cháy' },
    { code: 'HL2', name: 'Khu Hòn Gai' }
  ],
  ninhbinh: [
    { code: 'Z1', name: 'Tràng An & Cố Đô Hoa Lư' },
    { code: 'Z2', name: 'Tam Cốc – Bích Động & Thung Nham' },
    { code: 'Z3', name: 'Trung Tâm Thành Phố Ninh Bình' },
    { code: 'Z4', name: 'Vườn Quốc Gia Cúc Phương & Gia Viễn' },
    { code: 'Z5', name: 'Phát Diệm & Sinh Thái Ven Biển Kim Sơn' }
  ]
};

// Initial Mock Saved Plans
export const MOCK_SAVED_PLANS = [
  {
    id: 1,
    name: 'Khám phá Di sản Cố đô Huế 2 Ngày',
    city: 'hue',
    cityName: 'Huế',
    daysCount: 2,
    totalCost: 650000,
    createdAt: '2026-11-15T09:30:00Z',
    shareToken: 'hue-disan-2026',
    days: [
      {
        dayNumber: 1,
        title: 'Kinh Thành & Cố Đô Ngàn Năm',
        places: [
          {
            id: 1,
            name: 'Đại Nội Huế (Hoàng Thành)',
            time: '08:00 - 11:00',
            duration: 180,
            cost: 200000,
            zone: 'Kinh Thành & Bắc Sông Hương',
            tags: ['culture', 'sightseeing', 'history']
          },
          {
            id: 2,
            name: 'Chùa Thiên Mụ',
            time: '14:00 - 15:30',
            duration: 90,
            cost: 0,
            zone: 'Kinh Thành & Bắc Sông Hương',
            tags: ['culture', 'sightseeing']
          },
          {
            id: 3,
            name: 'Chợ Đông Ba',
            time: '16:00 - 18:00',
            duration: 120,
            cost: 50000,
            zone: 'Kinh Thành & Bắc Sông Hương',
            tags: ['food', 'shopping']
          }
        ]
      },
      {
        dayNumber: 2,
        title: 'Lăng Tẩm & Cảnh Sắc Sông Hương',
        places: [
          {
            id: 4,
            name: 'Lăng Khải Định',
            time: '08:30 - 10:30',
            duration: 120,
            cost: 150000,
            zone: 'Cụm Lăng Tẩm & Đồi Cảnh Quan',
            tags: ['culture', 'history']
          },
          {
            id: 5,
            name: 'Lăng Tự Đức',
            time: '14:00 - 16:00',
            duration: 120,
            cost: 150000,
            zone: 'Cụm Lăng Tẩm & Đồi Cảnh Quan',
            tags: ['culture', 'nature']
          },
          {
            id: 6,
            name: 'Phố đi bộ Chu Văn An - Võ Thị Sáu',
            time: '19:00 - 21:30',
            duration: 150,
            cost: 100000,
            zone: 'Trung tâm Nam Sông Hương',
            tags: ['nightlife', 'food']
          }
        ]
      }
    ]
  }
];

// Initial Mock Favorites
export const MOCK_SAMPLE_FAVORITES = [
  {
    id: 1,
    name: 'Đại Nội Huế (Hoàng Thành)',
    city: 'hue',
    zoneName: 'Kinh Thành & Bắc Sông Hương',
    estimatedCost: 200000,
    tags: ['culture', 'sightseeing', 'history'],
    address: 'Đường 23/8, Phường Thuận Thành, TP Huế'
  },
  {
    id: 51,
    name: 'Bán đảo Sơn Trà & Chùa Linh Ứng',
    city: 'danang',
    zoneName: 'Bán đảo Sơn Trà',
    estimatedCost: 0,
    tags: ['nature', 'sightseeing', 'culture'],
    address: 'Bán đảo Sơn Trà, TP Đà Nẵng'
  },
  {
    id: 102,
    name: 'Hồ Hoàn Kiếm & Đền Ngọc Sơn',
    city: 'hanoi',
    zoneName: 'Trung tâm Hà Nội',
    estimatedCost: 30000,
    tags: ['culture', 'sightseeing', 'history'],
    address: 'Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội'
  }
];

// Helper Utility Functions
export const formatVND = (cost) => {
  if (cost === 0 || cost === '0') return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN').format(cost) + ' ₫';
};

export const formatDuration = (minutes) => {
  if (!minutes) return '0p';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}p`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}p`;
};

export const getPlacesByCity = (cityKey) => {
  return PLACES_BY_CITY[cityKey] || [];
};

export const getCityConfig = (cityKey) => {
  return CITIES[cityKey] || CITIES.hue;
};

export const getCityZones = (cityKey) => {
  return ZONES_BY_CITY[cityKey] || [];
};
