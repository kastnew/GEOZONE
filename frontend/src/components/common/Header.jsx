import React from 'react';

export const Header = ({
  activeTab,
  onTabChange,
  currentUser,
  onOpenAuthModal,
  onLogout
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Navigation */}
        <div className="flex items-center space-x-6">
          <div
            onClick={() => onTabChange('planner')}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
              GZ
            </div>
            <div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">GeoZone AI</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hidden sm:inline">
                Zone Planner
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => onTabChange('planner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                activeTab === 'planner'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>🗺️</span>
              <span>Lập lịch trình</span>
            </button>

            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuthModal();
                } else {
                  onTabChange('my-trips');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                activeTab === 'my-trips'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>🧳</span>
              <span>Chuyến đi của tôi</span>
            </button>
          </nav>
        </div>

        {/* User Account Section */}
        <div className="flex items-center space-x-3">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <img
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100 object-cover"
                />
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-bold text-slate-800 block line-clamp-1">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold block uppercase">
                    {currentUser.role || 'USER'}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Đăng xuất"
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-slate-200 cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer flex items-center space-x-1"
            >
              <span>👤</span>
              <span>Đăng nhập / Đăng ký</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
