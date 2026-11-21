import React from 'react';

export default function BottomBack({
  label = '← Quay lại GeoZone AI',
  onClick = () => {}
}) {
  return (
    <a
      className="gzback"
      href="#trang-chu"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {label}
    </a>
  );
}
