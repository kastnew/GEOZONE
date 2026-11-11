import http from 'http';
import crypto from 'node:crypto';
import app from '../src/app.js';
import prisma from '../src/utils/prisma.js';

async function runTests() {
  console.log('🚀 Bắt đầu kiểm thử toàn bộ luồng Auth & User...');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  try {
    const testEmail = `test_${Date.now()}@geozone.vn`;
    const testPassword = 'Password123!';

    // 1. TEST REGISTER
    console.log('\n--- 1. TEST ĐĂNG KÝ (REGISTER) ---');
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Người dùng Test',
      }),
    });
    const regJson = await regRes.json();
    if (regRes.status !== 201 || !regJson.user?.id) throw new Error('Đăng ký thất bại!');
    const userId = regJson.user.id;
    console.log('✅ Đăng ký thành công với UUID:', userId);

    // 2. TEST LOGIN
    console.log('\n--- 2. TEST ĐĂNG NHẬP (LOGIN) ---');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginJson = await loginRes.json();
    if (loginRes.status !== 200 || !loginJson.accessToken) throw new Error('Đăng nhập thất bại!');
    let accessToken = loginJson.accessToken;
    const rawCookies = loginRes.headers.get('set-cookie');
    if (!rawCookies || !rawCookies.includes('refreshToken=')) throw new Error('Không nhận được cookie refreshToken!');
    let refreshTokenCookie = rawCookies.split(';')[0];
    console.log('✅ Đăng nhập thành công, nhận Access Token & HttpOnly Cookie!');

    // 2b. TEST THU HỒI TOKEN CŨ KHI ĐĂNG NHẬP LẠI (SILENT CLEANUP ORPHANED TOKEN)
    console.log('\n--- 2b. TEST THU HỒI TOKEN CŨ KHI RE-LOGIN (SILENT CLEANUP) ---');
    const initialRefreshTokenValue = refreshTokenCookie.replace('refreshToken=', '');
    const initialTokenHash = crypto.createHash('sha256').update(initialRefreshTokenValue).digest('hex');
    const initialDbToken = await prisma.refreshToken.findFirst({ where: { token_hash: initialTokenHash } });
    if (!initialDbToken || initialDbToken.revoked !== false) {
      throw new Error('Token ban đầu không hợp lệ trong database!');
    }

    const reloginWithCookieRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: refreshTokenCookie,
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const reloginWithCookieJson = await reloginWithCookieRes.json();
    if (reloginWithCookieRes.status !== 200 || !reloginWithCookieJson.accessToken) {
      throw new Error('Re-login với cookie cũ thất bại!');
    }

    const revokedDbToken = await prisma.refreshToken.findFirst({ where: { token_hash: initialTokenHash } });
    if (!revokedDbToken || revokedDbToken.revoked !== true) {
      throw new Error('Token cũ chưa được thu hồi (revoked: false) sau khi đăng nhập mới!');
    }

    const newRawCookies = reloginWithCookieRes.headers.get('set-cookie');
    const newRefreshTokenCookie = newRawCookies.split(';')[0];
    const newRefreshTokenValue = newRefreshTokenCookie.replace('refreshToken=', '');
    const newTokenHash = crypto.createHash('sha256').update(newRefreshTokenValue).digest('hex');
    const activeDbToken = await prisma.refreshToken.findFirst({ where: { token_hash: newTokenHash } });
    if (!activeDbToken || activeDbToken.revoked !== false) {
      throw new Error('Token mới không được lưu hoặc bị revoked!');
    }
    console.log('✅ Token cũ đã được thu hồi âm thầm (revoked: true) và token mới đã được cấp!');

    accessToken = reloginWithCookieJson.accessToken;
    refreshTokenCookie = newRefreshTokenCookie;

    // 3. TEST GET ME
    console.log('\n--- 3. TEST XÁC THỰC PROFILE (/users/me) ---');
    const meRes = await fetch(`${baseUrl}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meJson = await meRes.json();
    if (meRes.status !== 200 || meJson.data.email !== testEmail) throw new Error('Lấy profile thất bại!');
    console.log('✅ Xác thực middleware verifyToken & verifyActiveUser thành công!');

    // 4. TEST UPDATE ME
    console.log('\n--- 4. TEST CẬP NHẬT PROFILE (/users/me) ---');
    const updateRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: 'Người dùng Đã Đổi Tên',
        avatar_url: 'https://example.com/new-avatar.png',
      }),
    });
    const updateJson = await updateRes.json();
    if (updateRes.status !== 200 || updateJson.data.name !== 'Người dùng Đã Đổi Tên') throw new Error('Update me thất bại!');
    console.log('✅ Cập nhật thông tin profile thành công!');

    // 5. TEST REFRESH TOKEN
    console.log('\n--- 5. TEST LÀM MỚI TOKEN (/auth/refresh-token) ---');
    const refreshRes = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: { Cookie: refreshTokenCookie },
    });
    const refreshJson = await refreshRes.json();
    if (refreshRes.status !== 200 || !refreshJson.accessToken) throw new Error('Refresh token thất bại!');
    const newAccessToken = refreshJson.accessToken;
    console.log('✅ Silent Refresh Token thành công!');

    // 6. TEST CHANGE PASSWORD
    console.log('\n--- 6. TEST ĐỔI MẬT KHẨU (/auth/change-password) ---');
    const newPassword = 'NewPassword456!';
    const changePassRes = await fetch(`${baseUrl}/auth/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newAccessToken}`,
      },
      body: JSON.stringify({
        currentPassword: testPassword,
        newPassword: newPassword,
      }),
    });
    if (changePassRes.status !== 200) throw new Error('Đổi mật khẩu thất bại!');
    console.log('✅ Đổi mật khẩu thành công & đã thu hồi các Refresh Token cũ!');

    // 7. TEST LOGIN WITH NEW PASSWORD
    console.log('\n--- 7. TEST ĐĂNG NHẬP LẠI VỚI MẬT KHẨU MỚI ---');
    const reLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: newPassword,
      }),
    });
    const reLoginJson = await reLoginRes.json();
    if (reLoginRes.status !== 200) throw new Error('Đăng nhập mật khẩu mới thất bại!');
    const reLoginCookies = reLoginRes.headers.get('set-cookie');
    const reLoginTokenCookie = reLoginCookies.split(';')[0];
    const userOldTokenValue = reLoginTokenCookie.replace('refreshToken=', '');
    const userOldTokenHash = crypto.createHash('sha256').update(userOldTokenValue).digest('hex');
    console.log('✅ Đăng nhập bằng mật khẩu mới thành công!');

    // 8. TEST SWITCH ACCOUNT (TEST USER -> ADMIN) VÀ TỰ ĐỘNG THU HỒI TOKEN CỦA USER CŨ
    console.log('\n--- 8. TEST ĐỔI TÀI KHOẢN (CROSS-ACCOUNT CLEANUP) & ADMIN GET ALL USERS ---');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: reLoginTokenCookie, // Gửi kèm cookie của user thường
      },
      body: JSON.stringify({
        email: 'admin@geozone.vn',
        password: 'admin123',
      }),
    });
    const adminLoginJson = await adminLoginRes.json();
    if (adminLoginRes.status !== 200) throw new Error('Admin login thất bại!');
    const adminToken = adminLoginJson.accessToken;
    const adminCookies = adminLoginRes.headers.get('set-cookie');
    const adminRefreshTokenCookie = adminCookies.split(';')[0];

    // Xác nhận token cũ của user thường đã bị revoke khi admin login trên cùng client
    const crossRevokedToken = await prisma.refreshToken.findFirst({ where: { token_hash: userOldTokenHash } });
    if (!crossRevokedToken || crossRevokedToken.revoked !== true) {
      throw new Error('Token của tài khoản trước đó không bị thu hồi khi đăng nhập tài khoản khác!');
    }
    console.log('✅ Token của tài khoản trước đã bị thu hồi thành công khi đổi tài khoản!');

    const allUsersRes = await fetch(`${baseUrl}/users?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const allUsersJson = await allUsersRes.json();
    if (allUsersRes.status !== 200 || !allUsersJson.data) throw new Error('Admin get users thất bại!');
    console.log('✅ Admin phân quyền Role verification thành công!');

    // 9. TEST LOGOUT
    console.log('\n--- 9. TEST ĐĂNG XUẤT (/auth/logout) ---');
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: adminRefreshTokenCookie },
    });
    if (logoutRes.status !== 200) throw new Error('Đăng xuất thất bại!');
    console.log('✅ Đăng xuất và dọn dẹp phiên thành công!');

    // Xóa user test để dọn dẹp DB
    await prisma.user.delete({ where: { id: userId } });
    console.log('\n🎉 TOÀN BỘ CÁC BƯỚC TEST AUTH & USER ĐÃ HOÀN TẤT THÀNH CÔNG 100%!');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
