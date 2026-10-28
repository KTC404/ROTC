// Admin Portal Client Script

let adminDutyData = {};
let currentAdminTab = 'monday';
const SESSION_KEY = 'TRAFFIC_ADMIN_SESSION';

document.addEventListener('DOMContentLoaded', () => {
  // เรนเดอร์ข้อมูลทันทีตั้งแต่เปิดหน้า
  adminDutyData = window.loadLocalDutyData();
  checkAuth();
});

function getSavedPassword() {
  return sessionStorage.getItem(SESSION_KEY) || '';
}

function checkAuth() {
  const savedPass = getSavedPassword();
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');

  if (savedPass) {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    renderAdminStats(adminDutyData);
    renderAdminTabs();
    renderAdminTable(currentAdminTab);
    fetchAdminDutyData();
  } else {
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const password = document.getElementById('adminPasswordInput').value.trim();
  const loginBtn = document.getElementById('loginBtn');

  if (!password) return;

  loginBtn.disabled = true;
  loginBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> กำลังตรวจสอบรหัสผ่าน...`;

  try {
    const res = await window.ApiClient.adminLogin(password);
    if (res && res.success) {
      sessionStorage.setItem(SESSION_KEY, password);
      Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ',
        text: 'ยินดีต้อนรับสู่แผงควบคุมผู้ดูแลระบบ',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      checkAuth();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'รหัสผ่านไม่ถูกต้อง',
        text: res?.message || 'กรุณาตรวจสอบรหัสผ่านอีกครั้ง (รหัสเริ่มต้น: admin1234)'
      });
    }
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket mr-2"></i> เข้าสู่ระบบ`;
  }
}

function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  checkAuth();
  Swal.fire({
    icon: 'info',
    title: 'ออกจากระบบเรียบร้อยแล้ว',
    timer: 1200,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  btn.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash text-sm"></i>' : '<i class="fa-regular fa-eye text-sm"></i>';
}

async function fetchAdminDutyData(showFeedback = false) {
  try {
    const res = await window.ApiClient.fetchDutyData();
    if (res && res.success && res.data) {
      adminDutyData = res.data;
      renderAdminStats(adminDutyData);
      renderAdminTabs();
      renderAdminTable(currentAdminTab);

      if (showFeedback) {
        Swal.fire({ icon: 'success', title: 'อัปเดตข้อมูลสดแล้ว', timer: 1200, toast: true, position: 'top-end', showConfirmButton: false });
      }
    }
  } catch (err) {
    console.error('Fetch admin data error:', err);
  }
}

function renderAdminStats(data) {
  const container = document.getElementById('adminDayStatsGrid');
  if (!container) return;

  let html = '';
  for (const [key, day] of Object.entries(data)) {
    const stats = day.stats;
    const isSelected = currentAdminTab === key;

    html += `
      <div onclick="switchAdminTab('${key}')" class="cursor-pointer bg-slate-800/80 hover:bg-slate-750 p-3.5 rounded-2xl border ${isSelected ? 'border-amber-500 shadow-md shadow-amber-500/10' : 'border-slate-700'} transition flex flex-col justify-between">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-bold font-['Kanit'] ${isSelected ? 'text-amber-400' : 'text-slate-200'}">${day.name}</span>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${stats.isTotalFull ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}">
            ${stats.isTotalFull ? 'เต็ม' : `ว่าง ${stats.remainingTotal}`}
          </span>
        </div>
        <div class="text-xs text-slate-300 font-semibold mb-1">
          สมาชิก: ${stats.currentTotal} / ${stats.maxTotal} คน
        </div>
        <div class="text-[11px] text-slate-400">
          หญิง: <span class="${stats.isFemaleFull ? 'text-rose-400 font-bold' : 'text-pink-300'}">${stats.currentFemale} / ${stats.femaleQuota} ${stats.isFemaleFull ? '(เต็ม)' : ''}</span>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function renderAdminTabs() {
  const container = document.getElementById('adminDayTabs');
  if (!container) return;

  let html = '';
  for (const [key, day] of Object.entries(adminDutyData)) {
    const isCurrent = currentAdminTab === key;
    const stats = day.stats;

    html += `
      <button onclick="switchAdminTab('${key}')" class="px-4 py-2 text-xs font-semibold rounded-t-xl transition flex items-center gap-2 border-t border-x ${isCurrent ? 'bg-slate-700/90 text-amber-400 border-slate-600' : 'bg-transparent text-slate-400 border-transparent hover:text-white'}">
        <span>${day.name}</span>
        <span class="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full font-bold">
          ${stats.currentTotal}/${stats.maxTotal}
        </span>
      </button>
    `;
  }

  container.innerHTML = html;
}

function switchAdminTab(key) {
  currentAdminTab = key;
  renderAdminStats(adminDutyData);
  renderAdminTabs();
  renderAdminTable(key);
}

function renderAdminTable(key) {
  const container = document.getElementById('adminTableContent');
  const day = adminDutyData[key];
  if (!container || !day) return;

  const stats = day.stats;
  let rowsHtml = '';
  let index = 1;

  for (const member of (day.members || [])) {
    const isLeader = member.role.includes('หัวหน้า');
    
    let actionCol = '';
    if (member.isLocked) {
      actionCol = `<span class="text-[11px] text-slate-500 italic"><i class="fa-solid fa-lock text-[10px] mr-1"></i>สมาชิกเดิม (ล็อค)</span>`;
    } else {
      actionCol = `
        <button onclick="deleteMember('${key}', ${member.rowIndex || index + 4}, '${member.name}')" class="inline-flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border border-rose-500/30">
          <i class="fa-solid fa-trash-can text-xs"></i>
          <span>ลบรายชื่อ</span>
        </button>
      `;
    }

    rowsHtml += `
      <tr class="hover:bg-slate-750 transition border-b border-slate-700/60 ${member.isLocked ? '' : 'bg-slate-800/40'}">
        <td class="py-3 px-3 text-slate-400 font-mono text-center w-12">${index++}</td>
        <td class="py-3 px-3 font-semibold ${member.isLocked ? 'text-slate-200' : 'text-amber-300'}">
          ${member.name}
        </td>
        <td class="py-3 px-3 text-center">
          <span class="text-[11px] font-medium px-2 py-0.5 rounded-md ${member.gender === 'female' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}">
            ${member.gender === 'female' ? 'หญิง' : 'ชาย'}
          </span>
        </td>
        <td class="py-3 px-3">
          ${member.isLocked 
            ? `<span class="text-[11px] font-semibold px-2 py-0.5 rounded-md ${isLeader ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-700 text-slate-300'}"><i class="fa-solid fa-lock text-[10px] mr-1"></i>${member.role}</span>`
            : `<span class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><i class="fa-solid fa-user-plus text-[10px] mr-1"></i>สมัครผ่านเว็บ</span>`
          }
        </td>
        <td class="py-3 px-3 text-xs text-slate-300 font-mono">${member.phone || '-'}</td>
        <td class="py-3 px-3 text-xs text-slate-400">${member.time || '-'}</td>
        <td class="py-3 px-3 text-center">
          ${actionCol}
        </td>
      </tr>
    `;
  }

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-750 p-4 rounded-2xl border border-slate-700">
        <div>
          <h4 class="font-bold text-white text-base font-['Kanit'] flex items-center gap-2">
            <span>ตารางเวรจราจร - ${day.name}</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium ${stats.isTotalFull ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}">
              ${stats.isTotalFull ? 'เต็มแล้ว' : `ว่าง ${stats.remainingTotal} ที่`}
            </span>
          </h4>
          <p class="text-xs text-slate-400 mt-1">
            สมาชิกทั้งหมด: <strong class="text-white">${stats.currentTotal} / ${stats.maxTotal} คน</strong> | 
            โควต้าหญิง: <strong class="${stats.isFemaleFull ? 'text-rose-400' : 'text-pink-300'}">${stats.currentFemale} / ${stats.femaleQuota} คน ${stats.isFemaleFull ? '(เต็มแล้ว)' : ''}</strong>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="fetchAdminDutyData(true)" class="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 border border-slate-600">
            <i class="fa-solid fa-rotate-right"></i>
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto border border-slate-700 rounded-2xl">
        <table class="w-full text-xs text-left">
          <thead class="bg-slate-850 text-slate-400 border-b border-slate-700 font-medium">
            <tr>
              <th class="py-2.5 px-3 text-center">ลำดับ</th>
              <th class="py-2.5 px-3">ชื่อ - นามสกุล</th>
              <th class="py-2.5 px-3 text-center">เพศ</th>
              <th class="py-2.5 px-3">ประเภท / ตำแหน่ง</th>
              <th class="py-2.5 px-3">เบอร์ติดต่อ</th>
              <th class="py-2.5 px-3">เวลาที่ลงทะเบียน</th>
              <th class="py-2.5 px-3 text-center">การจัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/60">
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Delete Member
async function deleteMember(dayKey, rowIndex, memberName) {
  const confirmRes = await Swal.fire({
    title: 'ยืนยันการลบรายชื่อ?',
    text: `ต้องการลบรายชื่อ "${memberName}" หรือไม่?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#475569',
    confirmButtonText: 'ใช่, ลบรายชื่อ',
    cancelButtonText: 'ยกเลิก'
  });

  if (!confirmRes.isConfirmed) return;

  const adminPass = getSavedPassword();

  try {
    const res = await window.ApiClient.adminDeleteMember(dayKey, rowIndex, adminPass, memberName);
    if (res && res.success) {
      adminDutyData = res.data || window.loadLocalDutyData();
      renderAdminStats(adminDutyData);
      renderAdminTabs();
      renderAdminTable(currentAdminTab);

      Swal.fire({
        icon: 'success',
        title: 'ลบรายชื่อสำเร็จ!',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
  }
}

// Modal: Change Password
function openChangePasswordModal() {
  document.getElementById('oldPasswordInput').value = '';
  document.getElementById('newPasswordInput').value = '';
  document.getElementById('confirmNewPasswordInput').value = '';
  document.getElementById('changePasswordModal').classList.remove('hidden');
}

function closeChangePasswordModal() {
  document.getElementById('changePasswordModal').classList.add('hidden');
}

async function handleChangePassword(e) {
  e.preventDefault();
  const oldPass = document.getElementById('oldPasswordInput').value.trim();
  const newPass = document.getElementById('newPasswordInput').value.trim();
  const confirmPass = document.getElementById('confirmNewPasswordInput').value.trim();
  const btn = document.getElementById('btnSubmitChangePass');

  if (newPass !== confirmPass) {
    Swal.fire({ icon: 'warning', title: 'รหัสผ่านไม่ตรงกัน', text: 'กรุณากรอกรหัสผ่านใหม่และการยืนยันให้ตรงกัน' });
    return;
  }

  if (newPass.length < 4) {
    Swal.fire({ icon: 'warning', title: 'รหัสผ่านสั้นเกินไป', text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' });
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> กำลังบันทึก...`;

  try {
    const res = await window.ApiClient.adminChangePassword(oldPass, newPass);
    if (res && res.success) {
      sessionStorage.setItem(SESSION_KEY, newPass);
      closeChangePasswordModal();

      Swal.fire({
        icon: 'success',
        title: 'เปลี่ยนรหัสผ่านสำเร็จ!',
        html: `
          <div class="text-sm text-slate-700 bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-left space-y-1">
            <p><i class="fa-solid fa-check text-emerald-600 mr-1.5"></i>เปลี่ยนรหัสผ่านเรียบร้อยแล้ว</p>
            <p class="font-mono text-emerald-800 font-bold mt-2">รหัสผ่านใหม่: ${newPass}</p>
          </div>
        `
      });
    } else {
      Swal.fire({ icon: 'error', title: 'เปลี่ยนรหัสผ่านไม่สำเร็จ', text: res?.message || 'รหัสผ่านเดิมไม่ถูกต้อง' });
    }
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-check mr-1.5"></i> บันทึกรหัสผ่านใหม่`;
  }
}
