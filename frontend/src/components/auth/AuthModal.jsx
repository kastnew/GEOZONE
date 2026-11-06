import React, { useState } from 'react';
import { loginApi, registerApi } from '../../services/api.js';

export const AuthModal = ({ isOpen, onClose, onSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'login') {
        const data = await loginApi({ email, password });
        onSuccess(data.user);
      } else {
        const data = await registerApi({ email, password, name });
        onSuccess(data.user);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Thao tác không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setMode('login');
    setEmail('demo@geozone.vn');
    setPassword('password123');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
        >
          ✕
        </button>

        {/* Tab chuyển đổi */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              mode === 'login'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => { setMode('register'); setErrorMsg(null); }}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              mode === 'register'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Đăng ký tài khoản
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="example@geozone.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mật khẩu {mode === 'register' && '(tối thiểu 6 ký tự)'}
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md disabled:opacity-50 cursor-pointer text-sm mt-2"
          >
            {isLoading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập ngay' : 'Đăng ký tài khoản'}
          </button>
        </form>

        {/* Nút tiện ích test nhanh */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Dùng thử nhanh?</span>
          <button
            type="button"
            onClick={fillDemoAccount}
            className="text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            Điền tài khoản Demo
          </button>
        </div>
      </div>
    </div>
  );
};
