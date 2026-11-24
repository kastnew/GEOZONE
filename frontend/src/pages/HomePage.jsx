import React from 'react';
import '../styles/Hero.css';

export default function HomePage({
  onNavigate = () => {},
  onSelectCity = () => {}
}) {
  const heroPanels = [
    { key: 'hanoi', name: 'Hà Nội', img: '/images/heroes/hanoi.jpg' },
    { key: 'halong', name: 'Vịnh Hạ Long', img: '/images/heroes/halong.jpg' },
    { key: 'ninhbinh', name: 'Ninh Bình', img: '/images/heroes/ninhbinh.jpg' },
    { key: 'hue', name: 'Huế', img: '/images/heroes/hue.jpg' },
    { key: 'danang', name: 'Đà Nẵng', img: '/images/heroes/danang.jpg' }
  ];

  const handleCityClick = (cityKey) => {
    onSelectCity(cityKey);
    onNavigate('explore');
  };

  return (
    <section className="gz-view gz-hero on" data-view="home" aria-label="GeoZone AI">
      {/* 5 Dải ảnh tỉnh thành phối cảnh trải dài toàn màn hình */}
      {heroPanels.map((p) => (
        <div
          key={p.key}
          className="gz-p"
          data-k={p.key}
          style={{ backgroundImage: `url('${p.img}')` }}
          role="link"
          tabIndex={0}
          onClick={() => handleCityClick(p.key)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCityClick(p.key);
            }
          }}
          title={`Khám phá ${p.name}`}
        >
          <b>{p.name}</b>
        </div>
      ))}

      {/* Khối nội dung trung tâm trên nền gradient */}
      <div className="gz-ht">
        <span className="gz-pill">Nền tảng lập kế hoạch du lịch ứng dụng AI</span>
        <h1>
          GEOZONE AI
          <span className="gz-sub">Your Journey, Intelligently Planned</span>
        </h1>
        <p>Khám phá thế giới theo cách của riêng bạn.</p>
        <div className="gz-bar" />
        <div className="gz-cta">
          <a
            className="gz-btn big"
            href="#kham-pha"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('explore');
            }}
          >
            Khám phá điểm đến
          </a>
          <a
            className="gz-btn big ghost"
            href="#kham-pha"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('explore', { mode: 'plan' });
            }}
          >
            Tạo lịch trình tối ưu
          </a>
        </div>
      </div>
    </section>
  );
}
