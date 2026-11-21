import React, { useState } from 'react';
import '../../styles/AuthModal.css';

export default function AuthModal({
  isOpen = false,
  onClose = () => {},
  initialTab = 'login',
  onLogin = () => {},
  onRegister = () => {},
  errorMsg = ''
}) {
  const [tab, setTab] = useState(initialTab);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  const handleFillDemo = (role) => {
    if (role === 'admin') {
      setLoginForm({ email: 'admin@geozone.vn', password: 'admin123' });
    } else {
      setLoginForm({ email: 'demo@geozone.vn', password: 'password123' });
    }
    setTab('login');
  };

  const submitLogin = (e) => {
    e.preventDefault();
    onLogin({
      email: loginForm.email,
      username: loginForm.email,
      password: loginForm.password
    });
  };

  const submitReg = (e) => {
    e.preventDefault();
    onRegister(regForm);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 4000,
        display: 'grid',
        placeItems: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <dialog
        id="authDlg"
        open
        style={{ position: 'relative', margin: 0 }}
        aria-labelledby="auTitle"
      >
        <div className="dhead">
          <h2 id="auTitle">{tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
          <button
            type="button"
            id="auX"
            className="ghost"
            aria-label="Đóng"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <p className="au-sub" id="auSub" style={{ padding: '0 20px', margin: '12px 0 0', fontSize: '13px', color: '#64748b' }}>
          Đăng nhập để đồng bộ chuyến đi và địa điểm đã lưu của bạn trên mọi thiết bị.
        </p>

        {/* Tab Controls */}
        <div className="au-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`au-tab ${tab === 'login' ? 'on' : ''}`}
            id="auTabLogin"
            aria-selected={tab === 'login'}
            onClick={() => setTab('login')}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            role="tab"
            className={`au-tab ${tab === 'reg' ? 'on' : ''}`}
            id="auTabReg"
            aria-selected={tab === 'reg'}
            onClick={() => setTab('reg')}
          >
            Đăng ký
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              margin: '12px 20px 0',
              padding: '8px 12px',
              background: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '8px',
              fontSize: '13px'
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' ? (
          <form className="au-f" onSubmit={submitLogin}>
            <label>
              Email hoặc Tên tài khoản
              <input
                className="au-in"
                name="email"
                type="text"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
                placeholder="Ví dụ: demo@geozone.vn hoặc email của bạn"
                required
              />
            </label>
            <label>
              Mật khẩu
              <input
                className="au-in"
                type="password"
                name="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                placeholder="••••••••"
                required
              />
            </label>
            <button type="submit" className="au-btn" id="auSubmitLogin">
              Đăng nhập ngay
            </button>
          </form>
        ) : (
          /* Register Form */
          <form className="au-f" onSubmit={submitReg}>
            <label>
              Tên tài khoản
              <input
                className="au-in"
                name="username"
                value={regForm.username}
                onChange={(e) =>
                  setRegForm({ ...regForm, username: e.target.value })
                }
                placeholder="Nhập tên đăng nhập"
                required
              />
            </label>
            <label>
              Họ và tên hiển thị
              <input
                className="au-in"
                name="name"
                value={regForm.name}
                onChange={(e) =>
                  setRegForm({ ...regForm, name: e.target.value })
                }
                placeholder="Nguyễn Văn A"
                required
              />
            </label>
            <label>
              Địa chỉ Email
              <input
                className="au-in"
                type="email"
                name="email"
                value={regForm.email}
                onChange={(e) =>
                  setRegForm({ ...regForm, email: e.target.value })
                }
                placeholder="email@example.com"
                required
              />
            </label>
            <label>
              Mật khẩu
              <input
                className="au-in"
                type="password"
                name="password"
                value={regForm.password}
                onChange={(e) =>
                  setRegForm({ ...regForm, password: e.target.value })
                }
                placeholder="Tối thiểu 6 ký tự"
                required
              />
            </label>
            <button type="submit" className="au-btn" id="auSubmitReg">
              Tạo tài khoản mới
            </button>
          </form>
        )}

        {/* Demo Fast Fill Section */}
        <div className="au-demo" style={{ padding: '14px 20px', borderTop: '1px dashed #e2e8f0' }}>
          <span>Tài khoản mẫu thử nghiệm (bấm để điền nhanh):</span>
          <div style={{ display: 'grid', gap: '6px', marginTop: '6px' }}>
            <button type="button" onClick={() => handleFillDemo('user')}>
              👤 Người dùng thường (<code>demo@geozone.vn</code> / <code>password123</code>)
            </button>
            <button type="button" onClick={() => handleFillDemo('admin')}>
              ⭐ Quản trị viên (<code>admin@geozone.vn</code> / <code>admin123</code>)
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
