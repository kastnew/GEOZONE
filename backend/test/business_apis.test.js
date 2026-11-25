import http from 'http';
import crypto from 'node:crypto';
import app from '../src/app.js';
import prisma from '../src/utils/prisma.js';

async function runBusinessApiTests() {
  console.log('🚀 Bắt đầu kiểm thử toàn diện các API Nghiệp vụ (Plans, Favorites, Places, Zones, Tags)...');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  try {
    // -------------------------------------------------------------
    // SETUP: Tạo tài khoản Test User và Test Admin & Đồng bộ Sequences
    // -------------------------------------------------------------
    try {
      await prisma.$executeRawUnsafe(`SELECT setval('places_id_seq', (SELECT COALESCE(MAX(id), 1) FROM places));`);
      await prisma.$executeRawUnsafe(`SELECT setval('zones_id_seq', (SELECT COALESCE(MAX(id), 1) FROM zones));`);
      await prisma.$executeRawUnsafe(`SELECT setval('tags_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tags));`);
    } catch (e) {
      // Ignored if sequences already in sync
    }

    const userEmail = `user_${Date.now()}@geozone.vn`;
    const user2Email = `user2_${Date.now()}@geozone.vn`;
    const adminEmail = `admin_${Date.now()}@geozone.vn`;
    const password = 'Password123!';

    // Register User 1
    const regUser1 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password, name: 'User One' })
    });
    const user1Json = await regUser1.json();
    const user1Id = user1Json.user.id;

    // Login User 1
    const loginUser1 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password })
    });
    const user1LoginJson = await loginUser1.json();
    const user1Token = user1LoginJson.accessToken;

    // Register & Login User 2
    const regUser2 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user2Email, password, name: 'User Two' })
    });
    const user2Json = await regUser2.json();
    const user2Id = user2Json.user.id;

    const loginUser2 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user2Email, password })
    });
    const user2LoginJson = await loginUser2.json();
    const user2Token = user2LoginJson.accessToken;

    // Register & Upgrade Admin
    const regAdmin = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password, name: 'Admin Test' })
    });
    const adminJson = await regAdmin.json();
    const adminId = adminJson.user.id;

    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'ADMIN' }
    });

    const loginAdmin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password })
    });
    const adminLoginJson = await loginAdmin.json();
    const adminToken = adminLoginJson.accessToken;

    console.log('✅ Khởi tạo tài khoản test thành công: User 1, User 2, Admin.');

    // =============================================================
    // NHIỆM VỤ 3.1: API QUẢN LÝ LỊCH TRÌNH (PLANS)
    // =============================================================
    console.log('\n=========================================');
    console.log('--- TEST 3.1: QUẢN LÝ LỊCH TRÌNH (PLANS) ---');
    console.log('=========================================');

    const postPlan = (body) => fetch(`${baseUrl}/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`
      },
      body: JSON.stringify(body)
    });
    const expectInvalidPlan = async (label, body) => {
      const response = await postPlan(body);
      if (response.status !== 400) {
        throw new Error(`${label}: expected 400, got ${response.status}`);
      }
      console.log(`✅ ${label} -> 400`);
    };

    // 3.1.1 POST /api/v1/plans - Validate thiếu planData
    console.log('1. Test POST /api/v1/plans thiếu planData -> Phải trả về 400');
    const invalidPlanRes = await postPlan({ title: 'Chuyến đi thiếu dữ liệu' });
    if (invalidPlanRes.status !== 400) throw new Error(`Expected 400, got ${invalidPlanRes.status}`);
    console.log('✅ Bắt lỗi thành công khi thiếu planData (400)');
    await expectInvalidPlan('planData null', { planData: null });
    await expectInvalidPlan('planData primitive', { planData: 'not-an-object' });
    await expectInvalidPlan('planData là mảng', { planData: [] });
    await expectInvalidPlan('planData rỗng', { planData: {} });
    await expectInvalidPlan('planData thiếu days', { planData: { title: 'Thiếu ngày' } });
    await expectInvalidPlan('planData có days rỗng', { planData: { days: [] } });
    await expectInvalidPlan('planData có days sai kiểu', { planData: { days: 'ngày thứ nhất' } });
    await expectInvalidPlan('is_public là chuỗi false', {
      is_public: 'false',
      planData: { days: [{ day: 1 }] }
    });
    await expectInvalidPlan('totalBudget âm', {
      totalBudget: -1,
      planData: { days: [{ day: 1 }] }
    });
    await expectInvalidPlan('totalBudget là chuỗi', {
      totalBudget: '1000',
      planData: { days: [{ day: 1 }] }
    });
    await expectInvalidPlan('actualCost âm', {
      actualCost: -1,
      planData: { days: [{ day: 1 }] }
    });
    await expectInvalidPlan('totalDays âm', {
      totalDays: -1,
      planData: { days: [{ day: 1 }] }
    });
    await expectInvalidPlan('totalDays vượt quá giới hạn', {
      totalDays: 31,
      planData: { days: [{ day: 1 }] }
    });
    await expectInvalidPlan('totalDays không phải số nguyên', {
      totalDays: 1.5,
      planData: { days: [{ day: 1 }] }
    });
    await expectInvalidPlan('title chỉ chứa khoảng trắng', {
      title: '   ',
      planData: { days: [{ day: 1 }] }
    });
    await expectInvalidPlan('title sai kiểu', {
      title: 123,
      planData: { days: [{ day: 1 }] }
    });

    // 3.1.2 POST /api/v1/plans - Tạo lịch trình riêng tư (is_public: false)
    console.log('2. Test POST /api/v1/plans lưu lịch trình hợp lệ (is_public: false) -> 201');
    const createPrivatePlanRes = await fetch(`${baseUrl}/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        title: 'Đà Nẵng 3N2Đ Nghỉ Dưỡng',
        city: 'Da Nang',
        totalDays: 3,
        totalBudget: 2500000,
        actualCost: 2350000,
        strategyUsed: 'DIRECT_JSON',
        is_public: false,
        planData: {
          days: [
            { day: 1, places: ['Bãi biển Mỹ Khê', 'Chợ Hàn'] },
            { day: 2, places: ['Bà Nà Hills'] },
            { day: 3, places: ['Bán đảo Sơn Trà', 'Cầu Rồng'] }
          ]
        }
      })
    });
    const createPrivateJson = await createPrivatePlanRes.json();
    if (createPrivatePlanRes.status !== 201 || !createPrivateJson.data?.id) {
      throw new Error(`Tạo lịch trình thất bại: ${JSON.stringify(createPrivateJson)}`);
    }
    const privatePlanId = createPrivateJson.data.id;
    console.log(`✅ Lưu lịch trình riêng tư thành công (UUID: ${privatePlanId})`);

    // 3.1.3 POST /api/v1/plans - Tạo lịch trình công khai (is_public: true, tự sinh share_token)
    console.log('3. Test POST /api/v1/plans lưu lịch trình công khai (tự sinh share_token) -> 201');
    const createPublicPlanRes = await fetch(`${baseUrl}/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        title: 'Khám phá Đà Nẵng Mùa Hè',
        city: 'Da Nang',
        totalDays: 2,
        totalBudget: 1500000,
        is_public: true,
        share_token: 'client-selected-share-token',
        planData: { days: [{ day: 1, places: ['Ngũ Hành Sơn'] }] }
      })
    });
    const createPublicJson = await createPublicPlanRes.json();
    if (createPublicPlanRes.status !== 201 || !createPublicJson.data?.share_token) {
      throw new Error('Tạo lịch trình công khai thất bại hoặc không tự sinh share_token');
    }
    if (
      createPublicJson.data.share_token === 'client-selected-share-token'
      || !/^[0-9a-f]{32}$/.test(createPublicJson.data.share_token)
    ) {
      throw new Error('share_token phải được sinh bảo mật ở backend, không nhận giá trị từ client');
    }
    const publicPlanId = createPublicJson.data.id;
    const shareToken = createPublicJson.data.share_token;
    console.log(`✅ Lưu lịch trình công khai thành công với share_token: ${shareToken}`);

    // 3.1.4 GET /api/v1/plans - Lấy danh sách lịch trình của User 1
    console.log('4. Test GET /api/v1/plans lấy danh sách lịch trình của user -> 200');
    const getPlansRes = await fetch(`${baseUrl}/plans`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    const getPlansJson = await getPlansRes.json();
    if (getPlansRes.status !== 200 || !Array.isArray(getPlansJson.data) || getPlansJson.data.length < 2) {
      throw new Error('Lấy danh sách lịch trình không đúng!');
    }
    console.log(`✅ Lấy thành công ${getPlansJson.data.length} lịch trình, sắp xếp mới nhất`);

    // 3.1.5 GET /api/v1/plans/:planId - Định dạng UUID không hợp lệ -> 400
    console.log('5. Test GET /api/v1/plans/:planId với UUID sai -> 400');
    const invalidUuidRes = await fetch(`${baseUrl}/plans/not-a-valid-uuid`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    if (invalidUuidRes.status !== 400) throw new Error(`Expected 400, got ${invalidUuidRes.status}`);
    console.log('✅ Middleware validateUuidParam hoạt động chính xác (400)');

    // 3.1.6 GET /api/v1/plans/:planId - Không tìm thấy lịch trình -> 404
    console.log('6. Test GET /api/v1/plans/:planId với UUID không tồn tại -> 404');
    const notFoundUuid = '00000000-0000-0000-0000-000000000000';
    const notFoundPlanRes = await fetch(`${baseUrl}/plans/${notFoundUuid}`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    if (notFoundPlanRes.status !== 404) throw new Error(`Expected 404, got ${notFoundPlanRes.status}`);
    console.log('✅ checkOwner trả về 404 chuẩn khi không tìm thấy lịch trình');

    // 3.1.7 GET /api/v1/plans/:planId - User 2 cố tình truy cập lịch trình của User 1 -> 403
    console.log('7. Test GET /api/v1/plans/:planId - User 2 truy cập lịch trình User 1 -> Phải bị chặn 403');
    const forbiddenRes = await fetch(`${baseUrl}/plans/${privatePlanId}`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    if (forbiddenRes.status !== 403) throw new Error(`Expected 403, got ${forbiddenRes.status}`);
    console.log('✅ checkOwner chặn truy cập trái phép thành công (403)');

    // 3.1.8 GET /api/v1/plans/:planId - Chính chủ User 1 xem chi tiết -> 200
    console.log('8. Test GET /api/v1/plans/:planId - Chính chủ truy cập -> 200');
    const ownerPlanRes = await fetch(`${baseUrl}/plans/${privatePlanId}`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    const ownerPlanJson = await ownerPlanRes.json();
    if (ownerPlanRes.status !== 200 || ownerPlanJson.data?.id !== privatePlanId) {
      throw new Error('Chủ sở hữu xem chi tiết thất bại');
    }
    console.log('✅ Chủ sở hữu xem chi tiết lịch trình thành công (200)');

    // 3.1.9 GET /api/v1/plans/:planId - Admin xem chi tiết lịch trình của bất kỳ ai -> 200
    console.log('9. Test GET /api/v1/plans/:planId - Admin có quyền xem lịch trình người dùng -> 200');
    const adminViewPlanRes = await fetch(`${baseUrl}/plans/${privatePlanId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminViewPlanRes.status !== 200) throw new Error(`Admin xem lịch trình thất bại, got ${adminViewPlanRes.status}`);
    console.log('✅ Admin được phân quyền xem lịch trình người dùng thành công (200)');

    // 3.1.10 GET /api/v1/plans/share/:shareToken - Xem công khai không cần token -> 200
    console.log('10. Test GET /api/v1/plans/share/:shareToken xem công khai không cần Auth -> 200');
    const publicViewRes = await fetch(`${baseUrl}/plans/share/${shareToken}`);
    const publicViewJson = await publicViewRes.json();
    if (publicViewRes.status !== 200 || publicViewJson.data?.id !== publicPlanId) {
      throw new Error('Xem lịch trình công khai qua share_token thất bại');
    }
    console.log('✅ Xem lịch trình công khai thành công qua share_token (200)');

    const patchPlan = (planId, token, body) => fetch(`${baseUrl}/plans/${planId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    console.log('11. Test PATCH /api/v1/plans/:planId từ chối body rỗng/không hợp lệ -> 400');
    for (const invalidBody of [
      {},
      { unrelatedField: 'ignored' },
      { title: '' },
      { title: '   ' },
      { title: 'x'.repeat(201) },
      { status: 'INVALID_STATUS' },
      { is_public: 'false' }
    ]) {
      const invalidPatchRes = await patchPlan(privatePlanId, user1Token, invalidBody);
      if (invalidPatchRes.status !== 400) {
        throw new Error(`PATCH body ${JSON.stringify(invalidBody)}: expected 400, got ${invalidPatchRes.status}`);
      }
    }
    console.log('✅ PATCH từ chối body rỗng, field lạ, title/status/is_public không hợp lệ (400)');

    console.log('12. Test PATCH /api/v1/plans/:planId chặn người không sở hữu -> 403');
    const forbiddenPatchRes = await patchPlan(privatePlanId, user2Token, { title: 'Không được phép' });
    if (forbiddenPatchRes.status !== 403) {
      throw new Error(`Expected 403, got ${forbiddenPatchRes.status}`);
    }
    console.log('✅ PATCH chặn người không sở hữu (403)');

    console.log('13. Test PATCH cập nhật title và bỏ qua id/user_id/share_token từ client -> 200');
    const updateTitleRes = await patchPlan(privatePlanId, user1Token, {
      title: 'Chuyến đi đã đổi tên',
      id: '00000000-0000-0000-0000-000000000000',
      user_id: user2Id,
      share_token: 'client-selected-patch-token'
    });
    const updateTitleJson = await updateTitleRes.json();
    if (
      updateTitleRes.status !== 200
      || updateTitleJson.data?.title !== 'Chuyến đi đã đổi tên'
      || updateTitleJson.data?.id !== privatePlanId
      || updateTitleJson.data?.user_id !== user1Id
      || updateTitleJson.data?.share_token !== null
    ) {
      throw new Error(`PATCH cập nhật title hoặc whitelist dữ liệu sai: ${JSON.stringify(updateTitleJson)}`);
    }
    console.log('✅ PATCH đổi title; id, user_id, share_token do client gửi bị bỏ qua (200)');

    console.log('14. Test PATCH bật chia sẻ tự sinh share_token và mở được link -> 200');
    const enableShareRes = await patchPlan(privatePlanId, user1Token, { is_public: true });
    const enableShareJson = await enableShareRes.json();
    const patchShareToken = enableShareJson.data?.share_token;
    if (
      enableShareRes.status !== 200
      || enableShareJson.data?.is_public !== true
      || !/^[0-9a-f]{32}$/.test(patchShareToken || '')
    ) {
      throw new Error(`PATCH bật chia sẻ không tạo token hợp lệ: ${JSON.stringify(enableShareJson)}`);
    }
    const patchSharedPlanRes = await fetch(`${baseUrl}/plans/share/${patchShareToken}`);
    const patchSharedPlanJson = await patchSharedPlanRes.json();
    if (patchSharedPlanRes.status !== 200 || patchSharedPlanJson.data?.id !== privatePlanId) {
      throw new Error('Link chia sẻ sau PATCH bật công khai không truy cập được');
    }
    console.log('✅ PATCH bật chia sẻ sinh token và GET link trả về 200');

    console.log('15. Test PATCH tắt chia sẻ làm link cũ không truy cập được -> 404');
    const disableShareRes = await patchPlan(privatePlanId, user1Token, { is_public: false });
    const disableShareJson = await disableShareRes.json();
    if (disableShareRes.status !== 200 || disableShareJson.data?.is_public !== false) {
      throw new Error(`PATCH tắt chia sẻ thất bại: ${JSON.stringify(disableShareJson)}`);
    }
    const disabledShareRes = await fetch(`${baseUrl}/plans/share/${patchShareToken}`);
    if (disabledShareRes.status !== 404) {
      throw new Error(`Expected disabled share link to return 404, got ${disabledShareRes.status}`);
    }
    console.log('✅ Link chia sẻ bị vô hiệu hóa trả về 404');

    // 3.1.11 GET /api/v1/plans/share/:shareToken - shareToken không tồn tại -> 404
    console.log('16. Test GET /api/v1/plans/share/fake-token -> 404');
    const fakeTokenRes = await fetch(`${baseUrl}/plans/share/non-existent-share-token-xyz`);
    if (fakeTokenRes.status !== 404) throw new Error(`Expected 404, got ${fakeTokenRes.status}`);
    console.log('✅ Trả về 404 chuẩn xác khi share_token sai');

    // 3.1.12 DELETE /api/v1/plans/:planId - User 2 cố xóa lịch trình của User 1 -> 403
    console.log('17. Test DELETE /api/v1/plans/:planId bởi người khác -> 403');
    const forbiddenDeleteRes = await fetch(`${baseUrl}/plans/${privatePlanId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    if (forbiddenDeleteRes.status !== 403) throw new Error(`Expected 403, got ${forbiddenDeleteRes.status}`);
    console.log('✅ Chặn thành công hành vi xóa trái phép từ user khác (403)');

    // 3.1.13 DELETE /api/v1/plans/:planId - Chính chủ xóa lịch trình -> 200
    console.log('18. Test DELETE /api/v1/plans/:planId bởi chính chủ -> 200');
    const ownerDeleteRes = await fetch(`${baseUrl}/plans/${privatePlanId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    if (ownerDeleteRes.status !== 200) throw new Error(`Chính chủ xóa thất bại, got ${ownerDeleteRes.status}`);
    console.log('✅ Chủ sở hữu xóa lịch trình thành công (200)');

    // 3.1.14 DELETE /api/v1/plans/:planId - Xóa lại lần nữa -> 404
    console.log('19. Test DELETE /api/v1/plans/:planId lần nữa -> 404');
    const reDeleteRes = await fetch(`${baseUrl}/plans/${privatePlanId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    if (reDeleteRes.status !== 404) throw new Error(`Expected 404, got ${reDeleteRes.status}`);
    console.log('✅ Trả về 404 khi xóa bản ghi không còn tồn tại');

    // =============================================================
    // NHIỆM VỤ 3.2: API ĐỊA ĐIỂM YÊU THÍCH (FAVORITES)
    // =============================================================
    console.log('\n=========================================');
    console.log('--- TEST 3.2: ĐỊA ĐIỂM YÊU THÍCH (FAVORITES) ---');
    console.log('=========================================');

    // Lấy 1 địa điểm có sẵn trong database
    const samplePlace = await prisma.place.findFirst();
    if (!samplePlace) throw new Error('Cơ sở dữ liệu chưa có địa điểm nào để test!');
    const testPlaceId = samplePlace.id;

    // 3.2.1 POST /api/v1/users/me/favorites - Thêm địa điểm vào yêu thích
    console.log(`1. Test POST /api/v1/users/me/favorites với placeId: ${testPlaceId} -> 201`);
    const addFavRes = await fetch(`${baseUrl}/users/me/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`
      },
      body: JSON.stringify({ placeId: testPlaceId })
    });
    const addFavJson = await addFavRes.json();
    if (addFavRes.status !== 201 || !addFavJson.data?.id) {
      throw new Error(`Thêm yêu thích thất bại: ${JSON.stringify(addFavJson)}`);
    }
    console.log('✅ Thêm vào danh sách yêu thích thành công (201)');

    // 3.2.2 POST /api/v1/users/me/favorites - Thêm trùng lặp -> 409 Conflict
    console.log('2. Test POST /api/v1/users/me/favorites trùng lặp địa điểm -> Phải trả về 409');
    const duplicateFavRes = await fetch(`${baseUrl}/users/me/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`
      },
      body: JSON.stringify({ placeId: testPlaceId })
    });
    if (duplicateFavRes.status !== 409) throw new Error(`Expected 409 Conflict, got ${duplicateFavRes.status}`);
    console.log('✅ Bắt trùng lặp địa điểm yêu thích thành công (409 Conflict)');

    // 3.2.3 POST /api/v1/users/me/favorites - placeId không tồn tại -> 404
    console.log('3. Test POST /api/v1/users/me/favorites với placeId = 999999 -> 404');
    const notFoundPlaceFavRes = await fetch(`${baseUrl}/users/me/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`
      },
      body: JSON.stringify({ placeId: 999999 })
    });
    if (notFoundPlaceFavRes.status !== 404) throw new Error(`Expected 404, got ${notFoundPlaceFavRes.status}`);
    console.log('✅ Trả về 404 khi placeId không tồn tại');

    // 3.2.4 GET /api/v1/users/me/favorites - Lấy danh sách yêu thích
    console.log('4. Test GET /api/v1/users/me/favorites lấy danh sách kèm thông tin chi tiết -> 200');
    const getFavsRes = await fetch(`${baseUrl}/users/me/favorites`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    const getFavsJson = await getFavsRes.json();
    if (getFavsRes.status !== 200 || !Array.isArray(getFavsJson.data) || getFavsJson.data.length === 0) {
      throw new Error('Lấy danh sách yêu thích thất bại');
    }
    const firstFav = getFavsJson.data[0];
    if (!firstFav.place || !firstFav.place.name) {
      throw new Error('Danh sách yêu thích thiếu thông tin chi tiết địa điểm!');
    }
    console.log(`✅ Lấy danh sách yêu thích thành công: ${getFavsJson.data.length} địa điểm (kèm zone & tags)`);

    // 3.2.5 DELETE /api/v1/users/me/favorites/:placeId - Xóa khỏi yêu thích
    console.log(`5. Test DELETE /api/v1/users/me/favorites/${testPlaceId} -> 200`);
    const delFavRes = await fetch(`${baseUrl}/users/me/favorites/${testPlaceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    if (delFavRes.status !== 200) throw new Error(`Xóa yêu thích thất bại, got ${delFavRes.status}`);
    console.log('✅ Xóa khỏi danh sách yêu thích thành công (200)');

    // 3.2.6 DELETE /api/v1/users/me/favorites/:placeId - Xóa lại lần nữa -> 404
    console.log(`6. Test DELETE /api/v1/users/me/favorites/${testPlaceId} khi chưa có trong danh sách -> 404`);
    const reDelFavRes = await fetch(`${baseUrl}/users/me/favorites/${testPlaceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    if (reDelFavRes.status !== 404) throw new Error(`Expected 404, got ${reDelFavRes.status}`);
    console.log('✅ Trả về 404 chuẩn xác khi xóa địa điểm chưa được yêu thích');

    // =============================================================
    // NHIỆM VỤ 3.3: API QUẢN TRỊ DANH MỤC DÀNH CHO ADMIN (CATALOG CRUD)
    // =============================================================
    console.log('\n=========================================');
    console.log('--- TEST 3.3: QUẢN TRỊ DANH MỤC ADMIN (PLACES & ZONES) ---');
    console.log('=========================================');

    // --- TEST ZONES CRUD ---
    console.log('\n>>> A. QUẢN LÝ PHÂN VÙNG (ZONES)');

    // 3.3.1 GET /api/v1/zones - Danh sách Zones công khai
    console.log('1. Test GET /api/v1/zones (Public) -> 200');
    const getZonesRes = await fetch(`${baseUrl}/zones`);
    const getZonesJson = await getZonesRes.json();
    if (getZonesRes.status !== 200 || !Array.isArray(getZonesJson.data)) {
      throw new Error('Lấy danh sách zones thất bại');
    }
    console.log(`✅ Lấy thành công ${getZonesJson.data.length} phân vùng`);

    // 3.3.2 POST /api/v1/zones - User thường tạo zone -> 403
    console.log('2. Test POST /api/v1/zones bởi User thường -> 403');
    const forbiddenZoneRes = await fetch(`${baseUrl}/zones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`
      },
      body: JSON.stringify({ code: 'ZTEST', name: 'Test Zone' })
    });
    if (forbiddenZoneRes.status !== 403) throw new Error(`Expected 403, got ${forbiddenZoneRes.status}`);
    console.log('✅ verifyAdmin chặn User thường tạo Zone thành công (403)');

    // 3.3.3 POST /api/v1/zones - Admin tạo Zone mới -> 201
    const testZoneCode = `TZ_${Date.now().toString().slice(-6)}`;
    console.log(`3. Test POST /api/v1/zones bởi Admin với mã code: ${testZoneCode} -> 201`);
    const createZoneRes = await fetch(`${baseUrl}/zones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        code: testZoneCode,
        name: 'Phân vùng Khảo nghiệm Mới',
        description: 'Khu vực thử nghiệm chức năng CRUD cho đồ án',
        centerLat: 16.0544,
        centerLng: 108.2022
      })
    });
    const createZoneJson = await createZoneRes.json();
    if (createZoneRes.status !== 201 || !createZoneJson.data?.id) {
      throw new Error(`Admin tạo Zone thất bại: ${JSON.stringify(createZoneJson)}`);
    }
    const createdZoneId = createZoneJson.data.id;
    console.log(`✅ Admin tạo Zone thành công (ID: ${createdZoneId}, Code: ${testZoneCode})`);

    // 3.3.4 POST /api/v1/zones - Trùng mã code -> 409
    console.log(`4. Test POST /api/v1/zones trùng mã code ${testZoneCode} -> 409`);
    const duplicateZoneRes = await fetch(`${baseUrl}/zones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        code: testZoneCode,
        name: 'Phân vùng Trùng Lặp'
      })
    });
    if (duplicateZoneRes.status !== 409) throw new Error(`Expected 409 Conflict, got ${duplicateZoneRes.status}`);
    console.log('✅ Bắt trùng lặp mã Zone thành công (409 Conflict)');

    // 3.3.5 GET /api/v1/zones/:zoneId - Xem chi tiết 1 zone
    console.log(`5. Test GET /api/v1/zones/${createdZoneId} -> 200`);
    const getZoneRes = await fetch(`${baseUrl}/zones/${createdZoneId}`);
    const getZoneJson = await getZoneRes.json();
    if (getZoneRes.status !== 200 || getZoneJson.data?.id !== createdZoneId) {
      throw new Error('Xem chi tiết zone thất bại');
    }
    console.log('✅ Xem chi tiết phân vùng thành công (200)');

    // 3.3.6 PATCH /api/v1/zones/:zoneId - Admin cập nhật tên zone
    console.log(`6. Test PATCH /api/v1/zones/${createdZoneId} -> 200`);
    const updateZoneRes = await fetch(`${baseUrl}/zones/${createdZoneId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Phân vùng Khảo nghiệm Đã Đổi Tên'
      })
    });
    const updateZoneJson = await updateZoneRes.json();
    if (updateZoneRes.status !== 200 || updateZoneJson.data?.name !== 'Phân vùng Khảo nghiệm Đã Đổi Tên') {
      throw new Error('Cập nhật phân vùng thất bại');
    }
    console.log('✅ Admin cập nhật phân vùng thành công (200)');

    // --- TEST PLACES CRUD ---
    console.log('\n>>> B. QUẢN LÝ ĐỊA ĐIỂM (PLACES)');

    // 3.3.7 GET /api/v1/places - Tìm kiếm và lọc theo Query Params
    console.log('7. Test GET /api/v1/places?city=Da+Nang&tags=food -> 200');
    const searchPlacesRes = await fetch(`${baseUrl}/places?city=Da+Nang&tags=food`);
    const searchPlacesJson = await searchPlacesRes.json();
    if (searchPlacesRes.status !== 200 || !Array.isArray(searchPlacesJson.data)) {
      throw new Error('Tìm kiếm địa điểm thất bại');
    }
    console.log(`✅ Lọc địa điểm theo Query Params thành công: ${searchPlacesJson.data.length} kết quả`);

    // 3.3.8 POST /api/v1/places - User thường tạo địa điểm -> 403
    console.log('8. Test POST /api/v1/places bởi User thường -> 403');
    const forbiddenPlaceRes = await fetch(`${baseUrl}/places`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`
      },
      body: JSON.stringify({ name: 'Địa điểm Trái phép', zoneId: createdZoneId })
    });
    if (forbiddenPlaceRes.status !== 403) throw new Error(`Expected 403, got ${forbiddenPlaceRes.status}`);
    console.log('✅ verifyAdmin chặn User thường tạo Place thành công (403)');

    // 3.3.9 POST /api/v1/places - Admin tạo địa điểm thuộc Zone vừa tạo -> 201
    console.log(`9. Test POST /api/v1/places bởi Admin vào Zone ${createdZoneId} -> 201`);
    const createPlaceRes = await fetch(`${baseUrl}/places`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Quán Cà Phê Biển Đông Test',
        city: 'Da Nang',
        zoneId: createdZoneId,
        address: '123 Đường Hoàng Sa, Sơn Trà',
        estimatedCost: 65000,
        duration: 90,
        openingTime: '07:30',
        closingTime: '22:00',
        latitude: 16.0825,
        longitude: 108.2467,
        popularity: 0.85,
        rating: 4.8,
        shortDesc: 'Quán cà phê ngắm bình minh tuyệt đẹp tại Đà Nẵng',
        tags: ['cafe', 'beach', 'relax']
      })
    });
    const createPlaceJson = await createPlaceRes.json();
    if (createPlaceRes.status !== 201 || !createPlaceJson.data?.id) {
      throw new Error(`Admin tạo Place thất bại: ${JSON.stringify(createPlaceJson)}`);
    }
    const createdPlaceId = createPlaceJson.data.id;
    console.log(`✅ Admin tạo địa điểm thành công (ID: ${createdPlaceId}, Tên: "${createPlaceJson.data.name}")`);

    // 3.3.10 GET /api/v1/places/:placeId - Xem chi tiết địa điểm
    console.log(`10. Test GET /api/v1/places/${createdPlaceId} (Public) -> 200`);
    const getPlaceRes = await fetch(`${baseUrl}/places/${createdPlaceId}`);
    const getPlaceJson = await getPlaceRes.json();
    if (getPlaceRes.status !== 200 || getPlaceJson.data?.id !== createdPlaceId) {
      throw new Error('Xem chi tiết địa điểm thất bại');
    }
    if (!Array.isArray(getPlaceJson.data.tags) || !getPlaceJson.data.tags.includes('cafe')) {
      throw new Error('Tags của địa điểm không được ánh xạ đúng!');
    }
    console.log('✅ Xem chi tiết địa điểm thành công kèm tags');

    // 3.3.11 PATCH /api/v1/places/:placeId - Admin cập nhật địa điểm
    console.log(`11. Test PATCH /api/v1/places/${createdPlaceId} cập nhật giá và tên -> 200`);
    const updatePlaceRes = await fetch(`${baseUrl}/places/${createdPlaceId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Quán Cà Phê Biển Đông VIP',
        estimatedCost: 85000
      })
    });
    const updatePlaceJson = await updatePlaceRes.json();
    if (updatePlaceRes.status !== 200 || updatePlaceJson.data?.estimatedCost !== 85000) {
      throw new Error('Cập nhật địa điểm thất bại');
    }
    console.log('✅ Admin cập nhật địa điểm thành công (200)');

    // 3.3.12 DELETE /api/v1/zones/:zoneId - Thử xóa Zone khi đang chứa địa điểm -> 400
    console.log(`12. Test DELETE /api/v1/zones/${createdZoneId} khi Zone đang chứa địa điểm -> Phải trả về 400`);
    const failDeleteZoneRes = await fetch(`${baseUrl}/zones/${createdZoneId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (failDeleteZoneRes.status !== 400) throw new Error(`Expected 400, got ${failDeleteZoneRes.status}`);
    console.log('✅ Toàn vẹn dữ liệu được đảm bảo: Không thể xóa Zone đang chứa địa điểm (400)');

    // 3.3.13 DELETE /api/v1/places/:placeId - Admin xóa địa điểm
    console.log(`13. Test DELETE /api/v1/places/${createdPlaceId} bởi Admin -> 200`);
    const delPlaceRes = await fetch(`${baseUrl}/places/${createdPlaceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (delPlaceRes.status !== 200) throw new Error(`Xóa địa điểm thất bại, got ${delPlaceRes.status}`);
    console.log('✅ Admin xóa địa điểm thành công (200)');

    // 3.3.14 DELETE /api/v1/zones/:zoneId - Xóa Zone rỗng -> 200
    console.log(`14. Test DELETE /api/v1/zones/${createdZoneId} khi Zone đã rỗng -> 200`);
    const delZoneRes = await fetch(`${baseUrl}/zones/${createdZoneId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (delZoneRes.status !== 200) throw new Error(`Xóa Zone thất bại, got ${delZoneRes.status}`);
    console.log('✅ Xóa Zone rỗng thành công (200)');

    // --- TEST TAGS API ---
    console.log('\n>>> C. DANH MỤC TAGS');
    console.log('15. Test GET /api/v1/tags -> 200');
    const tagsRes = await fetch(`${baseUrl}/tags`);
    const tagsJson = await tagsRes.json();
    if (tagsRes.status !== 200 || !Array.isArray(tagsJson.data) || tagsJson.data.length === 0) {
      throw new Error('Lấy danh sách tags thất bại');
    }
    console.log(`✅ Lấy thành công ${tagsJson.data.length} tags phục vụ bộ lọc người dùng`);

    // -------------------------------------------------------------
    // CLEANUP DATABASE
    // -------------------------------------------------------------
    console.log('\n🧹 Dọn dẹp dữ liệu test...');
    await prisma.savedPlan.deleteMany({
      where: { user_id: { in: [user1Id, user2Id, adminId] } }
    });
    await prisma.userFavorite.deleteMany({
      where: { user_id: { in: [user1Id, user2Id, adminId] } }
    });
    await prisma.refreshToken.deleteMany({
      where: { user_id: { in: [user1Id, user2Id, adminId] } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [user1Id, user2Id, adminId] } }
    });
    console.log('✅ Dọn dẹp dữ liệu test hoàn tất!');

    console.log('\n🎉 TOÀN BỘ CÁC BƯỚC TEST BUSINESS APIS ĐÃ HOÀN TẤT THÀNH CÔNG 100%!');
  } catch (error) {
    console.error('\n❌ TEST THẤT BẠI:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    server.close();
  }
}

runBusinessApiTests();
