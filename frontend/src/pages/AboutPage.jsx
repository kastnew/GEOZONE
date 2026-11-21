import React from 'react';
import '../styles/About.css';

export default function AboutPage({ onNavigate = () => {} }) {
  const features = [
    {
      icon: '🗺️',
      title: 'Dữ liệu địa lý',
      desc: 'Phân vùng địa điểm để lộ trình gọn, ít di chuyển.'
    },
    {
      icon: '🧮',
      title: 'Thuật toán tối ưu hóa',
      desc: 'Cân đối ngân sách, thời gian và mức độ ưu tiên.'
    },
    {
      icon: '🤖',
      title: 'Mô hình ngôn ngữ lớn',
      desc: 'Hoàn thiện nội dung lịch trình theo từng ngày.'
    }
  ];

  return (
    <section className="gz-view gz-about on" data-view="about" aria-label="Giới thiệu GeoZone AI">
      {/* Page Banner Header */}
      <div
        className="gz-pb"
        data-k="halong"
        style={{ backgroundImage: "url('/images/heroes/halong.jpg')" }}
      >
        <div className="gz-wrap">
          <h1>Giới thiệu</h1>
          <p className="gz-crumb">
            <a
              href="#trang-chu"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home');
              }}
            >
              Trang chủ
            </a>{' '}
            / GeoZone AI
          </p>
        </div>
      </div>

      {/* Intro Split Section */}
      <div className="gz-intro">
        <div className="gz-wrap gz-split">
          <div>
            <h2>Mỗi chuyến đi là một hành trình khám phá</h2>
            <p>
              Mỗi chuyến đi là một hành trình khám phá những vùng đất mới, trải
              nghiệm văn hóa độc đáo và lưu giữ những khoảnh khắc đáng nhớ.
            </p>
            <p>
              Thế nhưng, để biến ý tưởng thành một chuyến đi hoàn chỉnh, bạn
              thường phải dành hàng giờ tìm kiếm địa điểm, cân đối ngân sách, tính
              toán thời gian và sắp xếp lộ trình di chuyển.
            </p>
            <p>
              <strong>
                GEOZONE AI ra đời để giúp việc lên kế hoạch du lịch trở nên đơn
                giản và thông minh hơn.
              </strong>{' '}
              Là nền tảng lập kế hoạch du lịch ứng dụng trí tuệ nhân tạo (AI),
              GEOZONE kết hợp dữ liệu địa lý, thuật toán tối ưu hóa và mô hình
              ngôn ngữ lớn (LLM) để xây dựng những lịch trình phù hợp với sở
              thích, ngân sách và quỹ thời gian của mỗi người.
            </p>
            <a
              className="gz-btn"
              href="#kham-pha"
              style={{ marginTop: '12px' }}
              onClick={(e) => {
                e.preventDefault();
                onNavigate('explore');
              }}
            >
              Khám phá điểm đến
            </a>
          </div>

          <div className="gz-feats">
            {features.map((f, idx) => (
              <div key={idx} className="gz-f">
                <span style={{ fontSize: '24px' }}>{f.icon}</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}>
                    {f.title}
                  </strong>
                  <span style={{ color: '#5b6781', fontSize: '14px' }}>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
