// Hiển thị nguyên trang GeoZone (repo leduc229-oss/geozone1) đặt tại public/geozone1/.
// Dùng iframe để giữ y nguyên giao diện, CSS và JS gốc; dữ liệu JSON tải tương đối
// từ public/geozone1/data/.
export default function Geozone1Frame() {
  const src = `${import.meta.env.BASE_URL}geozone1/index.html`;
  return (
    <iframe
      title="GeoZone AI"
      src={src}
      style={{ border: 0, width: '100%', height: '100vh', display: 'block' }}
      allow="geolocation"
    />
  );
}
