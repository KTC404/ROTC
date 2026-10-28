// Traffic Duty Registration Client Application (Applicant Side)

let dutyData = {};
let selectedDayKey = 'monday';
let currentModalTab = 'monday';

const DAY_THEMES = {
  monday: {
    color: 'blue',
    accentBg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    headerGradient: 'from-blue-600 to-indigo-700',
    pill: 'bg-blue-500'
  },
  tuesday: {
    color: 'pink',
    accentBg: 'bg-pink-50',
    border: 'border-pink-200',
    badge: 'bg-pink-100 text-pink-800',
    headerGradient: 'from-pink-500 to-rose-600',
    pill: 'bg-pink-500'
  },
  wednesday: {
    color: 'emerald',
    accentBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    headerGradient: 'from-emerald-500 to-teal-700',
    pill: 'bg-emerald-500'
  },
  thursday: {
    color: 'orange',
    accentBg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-800',
    headerGradient: 'from-amber-500 to-orange-600',
    pill: 'bg-orange-500'
  },
  friday: {
    color: 'cyan',
    accentBg: 'bg-cyan-50',
    border: 'border-cyan-200',
    badge: 'bg-cyan-100 text-cyan-800',
    headerGradient: 'from-cyan-500 to-blue-600',
    pill: 'bg-cyan-500'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. เรนเดอร์ข้อมูลเริ่มต้นทันที (Instant Render 0.01s - ไม่ต้องรอโหลด)
  dutyData = window.loadLocalDutyData();
  renderDayCards(dutyData);
  renderDaySelector(dutyData);
  renderQuickSummaryTable(dutyData);
  onGenderChanged();

  // 2. ตรวจสอบการเชื่อมต่อ Google Sheets ในพื้นหลัง
  fetchDutyData();
});

function checkGasBanner() {
  const banner = document.getElementById('gasConfigBanner');
  if (!window.APP_CONFIG.GAS_WEBAPP_URL) {
    banner?.classList.remove('hidden');
  } else {
    banner?.classList.add('hidden');
  }
}

function promptForGasUrl() {
  Swal.fire({
    title: 'เชื่อมต่อ Google Sheets API',
    html: `
      <div class="text-xs text-slate-600 text-left space-y-2">
        <p>นำ <strong>Web App URL</strong> ที่ได้จากการ Deploy ใน Google Sheets (ส่วนขยาย > Apps Script > การทำให้ใช้งานได้) มาวางที่นี่:</p>
        <p class="text-[11px] text-slate-400">ตัวอย่าง: https://script.google.com/macros/s/xxxx/exec</p>
      </div>
    `,
    input: 'url',
    inputValue: window.APP_CONFIG.GAS_WEBAPP_URL || '',
    placeholder: 'https://script.google.com/macros/s/xxxx/exec',
    showCancelButton: true,
    confirmButtonText: 'บันทึกและเชื่อมต่อ',
    cancelButtonText: 'ยกเลิก'
  }).then((res) => {
    if (res.isConfirmed && res.value) {
      const trimmed = res.value.trim();
      window.APP_CONFIG.GAS_WEBAPP_URL = trimmed;
      localStorage.setItem('TRAFFIC_GAS_URL', trimmed);
      checkGasBanner();
      fetchDutyData(true);
    }
  });
}

// Fetch duty data from Google Sheets API
async function fetchDutyData(showFeedback = false) {
  const refreshIcon = document.getElementById('refreshIcon');
  if (refreshIcon) refreshIcon.classList.add('fa-spin');

  try {
    const result = await window.ApiClient.fetchDutyData();
    if (result && result.success && result.data) {
      dutyData = result.data;
      renderDayCards(dutyData);
      renderDaySelector(dutyData);
      renderQuickSummaryTable(dutyData);

      const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const lastUpdatedEl = document.getElementById('lastUpdatedText');
      if (lastUpdatedEl) {
        if (result.isLocalFallback) {
          lastUpdatedEl.innerHTML = `<span class="text-amber-500 font-medium cursor-pointer" onclick="promptForGasUrl()"><i class="fa-solid fa-cloud-arrow-up mr-1"></i>โหมดข้อมูลเริ่มต้น (คลิกเพื่อเชื่อมต่อ Google Sheets)</span>`;
        } else {
          lastUpdatedEl.innerHTML = `<span class="text-emerald-600 font-medium"><i class="fa-solid fa-circle-check mr-1"></i>เชื่อมต่อ Google Sheets สด (${timeStr} น.)</span>`;
        }
      }

      if (showFeedback) {
        Swal.fire({
          icon: 'success',
          title: 'อัปเดตข้อมูลเรียบร้อย',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500
        });
      }
    }
  } catch (err) {
    console.warn('Fetch duty warning:', err);
  } finally {
    if (refreshIcon) {
      setTimeout(() => refreshIcon.classList.remove('fa-spin'), 300);
    }
  }
}

// Render the 5 Day Cards
function renderDayCards(data) {
  const container = document.getElementById('dayCardsContainer');
  if (!container) return;

  const currentGender = document.querySelector('input[name="gender"]:checked')?.value || 'male';

  let html = '';
  for (const [key, day] of Object.entries(data)) {
    const theme = DAY_THEMES[key] || DAY_THEMES.monday;
    const stats = day.stats;
    const percentFilled = Math.min(100, Math.round((stats.currentTotal / stats.maxTotal) * 100));

    let statusBadge = '';
    let cardBorder = theme.border;
    let cardBg = 'bg-white';

    if (stats.isTotalFull) {
      statusBadge = `<span class="bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><i class="fa-solid fa-circle-xmark text-xs"></i> เต็มแล้ว</span>`;
      cardBorder = 'border-rose-200';
      cardBg = 'bg-slate-50/70';
    } else if (stats.isFemaleFull) {
      statusBadge = `<span class="bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1"><i class="fa-solid fa-mars text-xs"></i> รับเฉพาะชาย</span>`;
    } else {
      statusBadge = `<span class="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1"><i class="fa-solid fa-circle-check text-xs"></i> เปิดรับสมัคร</span>`;
    }

    let femaleBadge = '';
    if (stats.isFemaleFull) {
      femaleBadge = `<span class="inline-flex items-center gap-1 bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-md text-[11px] font-bold">
        <i class="fa-solid fa-venus"></i> หญิง ${stats.currentFemale}/${stats.femaleQuota} (เต็ม)
      </span>`;
    } else {
      femaleBadge = `<span class="inline-flex items-center gap-1 bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded-md text-[11px] font-medium">
        <i class="fa-solid fa-venus"></i> หญิง ${stats.currentFemale}/${stats.femaleQuota} (ว่าง ${stats.remainingFemale})
      </span>`;
    }

    const isFemaleAndFull = currentGender === 'female' && stats.isFemaleFull;
    const canRegister = !stats.isTotalFull && !isFemaleAndFull;

    let actionBtn = '';
    if (canRegister) {
      actionBtn = `<button onclick="selectDayAndScroll('${key}')" class="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white transition flex items-center justify-center gap-1.5 shadow-sm">
        <i class="fa-solid fa-pen-to-square text-[11px]"></i>
        <span>สมัครวันนี้</span>
      </button>`;
    } else if (stats.isTotalFull) {
      actionBtn = `<button disabled class="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-slate-200 text-slate-400 cursor-not-allowed flex items-center justify-center gap-1.5">
        <i class="fa-solid fa-ban text-[11px]"></i>
        <span>ยอดสมาชิกเต็มแล้ว</span>
      </button>`;
    } else if (isFemaleAndFull) {
      actionBtn = `<button disabled class="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 cursor-not-allowed flex items-center justify-center gap-1.5">
        <i class="fa-solid fa-venus-slash text-[11px]"></i>
        <span>โควต้าหญิงเต็มแล้ว</span>
      </button>`;
    }

    const lockedMembers = (day.members || []).filter(m => m.isLocked);
    const lockedNames = lockedMembers.map(m => m.name).slice(0, 3).join(', ');
    const moreLocked = lockedMembers.length > 3 ? ` +${lockedMembers.length - 3}` : '';

    html += `
      <div class="${cardBg} rounded-2xl border ${cardBorder} p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
        <div class="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r ${theme.headerGradient}"></div>

        <div class="space-y-3 pt-1">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full ${theme.pill}"></span>
              <h3 class="font-bold text-slate-900 text-sm font-['Kanit']">${day.name}</h3>
            </div>
            ${statusBadge}
          </div>

          <div class="space-y-1.5">
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-slate-500 font-medium">สมาชิกทั้งหมด</span>
              <span class="font-bold text-slate-800">${stats.currentTotal} / ${stats.maxTotal} คน</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
              <div class="h-2 rounded-full progress-bar-fill ${stats.isTotalFull ? 'bg-rose-500' : 'bg-indigo-600'}" style="width: ${percentFilled}%"></div>
            </div>
            <div class="flex justify-between text-[11px] text-slate-500">
              <span>ว่าง ${stats.remainingTotal} ที่</span>
              <span>${percentFilled}%</span>
            </div>
          </div>

          <div class="pt-1 flex items-center justify-between border-t border-slate-100 text-xs">
            <span class="text-slate-500 text-[11px]">โควต้าหญิง:</span>
            ${femaleBadge}
          </div>

          <div class="bg-slate-50 rounded-lg p-2 text-[11px] border border-slate-100 text-slate-600">
            <div class="flex items-center justify-between font-semibold text-slate-700 mb-0.5">
              <span><i class="fa-solid fa-lock text-[10px] text-indigo-500 mr-1"></i>สมาชิกเดิม:</span>
              <span class="text-indigo-600 font-bold">${lockedMembers.length} คน</span>
            </div>
            <p class="truncate text-[10px] text-slate-500" title="${lockedMembers.map(m => m.name).join(', ')}">
              ${lockedNames}${moreLocked}
            </p>
          </div>
        </div>

        <div class="pt-3 space-y-2 mt-2">
          ${actionBtn}
          <button onclick="openMemberListModal('${key}')" class="w-full text-center text-[11px] text-slate-500 hover:text-indigo-600 font-medium py-1 transition flex items-center justify-center gap-1">
            <span>ดูสมาชิกทั้งหมด (${stats.currentTotal} คน)</span>
            <i class="fa-solid fa-chevron-right text-[9px]"></i>
          </button>
        </div>

      </div>
    `;
  }

  container.innerHTML = html;
}

// Render Day Selector in the Form
function renderDaySelector(data) {
  const container = document.getElementById('daySelectorGrid');
  if (!container) return;

  const currentGender = document.querySelector('input[name="gender"]:checked')?.value || 'male';

  let html = '';
  for (const [key, day] of Object.entries(data)) {
    const stats = day.stats;
    const isSelected = selectedDayKey === key;
    const theme = DAY_THEMES[key] || DAY_THEMES.monday;

    const isTotalFull = stats.isTotalFull;
    const isFemaleAndFull = currentGender === 'female' && stats.isFemaleFull;
    const isDisabled = isTotalFull || isFemaleAndFull;

    let subText = `ว่าง ${stats.remainingTotal} ที่`;
    if (isTotalFull) {
      subText = 'เต็มแล้ว';
    } else if (isFemaleAndFull) {
      subText = 'โควต้าหญิงเต็ม';
    }

    let cardClasses = `day-radio-card p-3 rounded-xl border-2 text-center cursor-pointer relative `;
    if (isDisabled) {
      cardClasses += `disabled border-slate-200 text-slate-400 `;
    } else if (isSelected) {
      cardClasses += `selected border-indigo-600 bg-indigo-50/60 text-indigo-950 font-semibold `;
    } else {
      cardClasses += `border-slate-200 bg-white hover:border-indigo-300 text-slate-700 `;
    }

    html += `
      <div onclick="${isDisabled ? '' : `selectDayRadio('${key}')`}" class="${cardClasses}">
        <div class="flex items-center justify-center gap-1.5 mb-1">
          <span class="w-2.5 h-2.5 rounded-full ${theme.pill}"></span>
          <span class="text-xs font-bold font-['Kanit']">${day.name}</span>
        </div>
        <div class="text-[11px] ${isDisabled ? 'text-rose-500 font-medium' : 'text-slate-500'}">
          ${subText}
        </div>
        ${isSelected ? '<div class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] shadow"><i class="fa-solid fa-check"></i></div>' : ''}
      </div>
    `;
  }

  container.innerHTML = html;
}

function selectDayRadio(key) {
  selectedDayKey = key;
  renderDaySelector(dutyData);
  updateDaySelectionHelp();
}

function selectDayAndScroll(key) {
  selectDayRadio(key);
  const formElement = document.getElementById('registerSection');
  if (formElement) {
    formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('fullNameInput')?.focus();
  }
}

function onGenderChanged() {
  const gender = document.querySelector('input[name="gender"]:checked')?.value || 'male';
  const labelMale = document.getElementById('labelGenderMale');
  const labelFemale = document.getElementById('labelGenderFemale');
  const prefixInput = document.getElementById('prefixInput');
  const warningDiv = document.getElementById('femaleQuotaWarning');

  if (gender === 'male') {
    labelMale.classList.add('selected-male');
    labelFemale.classList.remove('selected-female');
    if (prefixInput && (prefixInput.value === 'นางสาว' || prefixInput.value === 'น.ส.')) {
      prefixInput.value = 'นาย';
    }
    warningDiv?.classList.add('hidden');
  } else {
    labelFemale.classList.add('selected-female');
    labelMale.classList.remove('selected-male');
    if (prefixInput && prefixInput.value === 'นาย') {
      prefixInput.value = 'นางสาว';
    }
    warningDiv?.classList.remove('hidden');
  }

  if (dutyData && Object.keys(dutyData).length > 0) {
    const currentDayStats = dutyData[selectedDayKey]?.stats;
    if (gender === 'female' && currentDayStats && currentDayStats.isFemaleFull) {
      const availableDay = Object.keys(dutyData).find(k => !dutyData[k].stats.isTotalFull && !dutyData[k].stats.isFemaleFull);
      if (availableDay) {
        selectedDayKey = availableDay;
      }
    }
    renderDayCards(dutyData);
    renderDaySelector(dutyData);
    updateDaySelectionHelp();
  }
}

function updateDaySelectionHelp() {
  const helpEl = document.getElementById('daySelectionHelp');
  if (!helpEl || !dutyData[selectedDayKey]) return;

  const day = dutyData[selectedDayKey];
  const stats = day.stats;
  const currentGender = document.querySelector('input[name="gender"]:checked')?.value || 'male';

  if (stats.isTotalFull) {
    helpEl.innerHTML = `<span class="text-rose-600 font-semibold"><i class="fa-solid fa-triangle-exclamation mr-1"></i>${day.name} สมาชิกเต็มแล้ว (${stats.maxTotal} คน) กรุณาเลือกวันอื่น</span>`;
  } else if (currentGender === 'female' && stats.isFemaleFull) {
    helpEl.innerHTML = `<span class="text-rose-600 font-semibold"><i class="fa-solid fa-triangle-exclamation mr-1"></i>${day.name} โควต้าหญิงเต็มแล้ว (${stats.femaleQuota} คน) กรุณาเลือกวันอื่น</span>`;
  } else {
    helpEl.innerHTML = `<span class="text-indigo-600 font-medium"><i class="fa-solid fa-circle-check mr-1"></i>เลือก: <strong>${day.name}</strong> (ว่าง ${stats.remainingTotal} ที่ | โควต้าหญิงคงเหลือ ${stats.remainingFemale} ที่)</span>`;
  }
}

function renderQuickSummaryTable(data) {
  const tbody = document.getElementById('quickSummaryTableBody');
  if (!tbody) return;

  let html = '';
  for (const [key, day] of Object.entries(data)) {
    const stats = day.stats;
    const theme = DAY_THEMES[key];

    let statusPill = '';
    if (stats.isTotalFull) {
      statusPill = '<span class="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">เต็มแล้ว</span>';
    } else if (stats.isFemaleFull) {
      statusPill = '<span class="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">รับเฉพาะชาย</span>';
    } else {
      statusPill = '<span class="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">เปิดรับ</span>';
    }

    html += `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-2.5 font-medium text-slate-800 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full ${theme.pill}"></span>
          <span>${day.name}</span>
        </td>
        <td class="py-2.5 text-center font-semibold text-slate-700">
          ${stats.currentTotal} / ${stats.maxTotal}
        </td>
        <td class="py-2.5 text-center">
          <span class="${stats.isFemaleFull ? 'text-rose-600 font-bold' : 'text-slate-600'}">
            ${stats.currentFemale} / ${stats.femaleQuota}
          </span>
        </td>
        <td class="py-2.5 text-right">
          ${statusPill}
        </td>
      </tr>
    `;
  }

  tbody.innerHTML = html;
}

// Form Submission
async function handleRegistration(event) {
  event.preventDefault();

  const prefix = document.getElementById('prefixInput').value;
  const fullName = document.getElementById('fullNameInput').value.trim();
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const phone = document.getElementById('phoneInput').value.trim();
  const note = document.getElementById('noteInput').value.trim();
  const submitBtn = document.getElementById('submitRegBtn');

  if (!fullName) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอกชื่อ-นามสกุล', text: 'จำเป็นต้องระบุชื่อผู้สมัคร' });
    return;
  }

  const day = dutyData[selectedDayKey];
  if (!day) return;

  if (day.stats.isTotalFull) {
    Swal.fire({ icon: 'error', title: 'ไม่สามารถลงทะเบียนได้', text: `${day.name} สมาชิกเต็มจำนวนแล้ว (${day.stats.maxTotal} คน)` });
    return;
  }

  if (gender === 'female' && day.stats.isFemaleFull) {
    Swal.fire({ icon: 'error', title: 'โควต้าหญิงเต็มแล้ว', text: `โควต้าหญิงสำหรับ ${day.name} เต็มแล้ว (${day.stats.femaleQuota} คน) กรุณาเลือกวันอื่น` });
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> กำลังบันทึกข้อมูล...`;

  try {
    const result = await window.ApiClient.register({
      dayKey: selectedDayKey,
      prefix,
      fullName,
      gender,
      phone,
      note
    });

    if (result && result.success) {
      dutyData = result.data || window.loadLocalDutyData();
      renderDayCards(dutyData);
      renderDaySelector(dutyData);
      renderQuickSummaryTable(dutyData);

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.65 } });

      document.getElementById('fullNameInput').value = '';
      document.getElementById('phoneInput').value = '';
      document.getElementById('noteInput').value = '';

      Swal.fire({
        icon: 'success',
        title: 'ลงทะเบียนสำเร็จ!',
        html: `
          <div class="text-sm text-slate-700 space-y-1 text-left bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <p><strong>ชื่อ-นามสกุล:</strong> ${prefix} ${fullName}</p>
            <p><strong>วันเข้าเวร:</strong> ${day.name}</p>
            <p><strong>เพศ:</strong> ${gender === 'female' ? 'หญิง' : 'ชาย'}</p>
            <p class="text-xs text-emerald-700 font-semibold mt-2"><i class="fa-solid fa-check-circle mr-1"></i>บันทึกลง Google Sheets เรียบร้อยแล้ว</p>
          </div>
        `,
        confirmButtonColor: '#4f46e5',
        confirmButtonText: 'ตกลง'
      });
    } else if (result && result.isNotConnectedToSheets) {
      dutyData = result.data || window.loadLocalDutyData();
      renderDayCards(dutyData);
      renderDaySelector(dutyData);
      renderQuickSummaryTable(dutyData);

      document.getElementById('fullNameInput').value = '';
      document.getElementById('phoneInput').value = '';
      document.getElementById('noteInput').value = '';

      Swal.fire({
        icon: 'warning',
        title: 'บันทึกในเครื่องแล้ว แต่ "ยังไม่ขึ้น Google Sheets"',
        html: `
          <div class="text-xs text-slate-600 text-left space-y-2 bg-amber-50 p-3.5 rounded-xl border border-amber-200 leading-relaxed">
            <p class="font-semibold text-amber-900"><i class="fa-solid fa-triangle-exclamation text-amber-600 mr-1"></i>สาเหตุที่ยังไม่บันทึกลง Google Sheets:</p>
            <p>เนื่องจากยังไม่ได้ใส่ <strong>Google Apps Script Web App URL</strong> ในระบบ ข้อมูลจึงถูกบันทึกไว้ในเบราว์เซอร์ของคุณชั่วคราวเท่านั้น</p>
            <p class="font-semibold text-indigo-900 mt-2">วิธีแก้ปัญหา:</p>
            <p>1. เปิด Google Sheets -> ส่วนขยาย (Extensions) -> Apps Script<br>
               2. กด Deploy (การทำให้ใช้งานได้) -> เว็บแอป (Web app) -> สิทธิ์เข้าถึง "ทุกคน (Anyone)"<br>
               3. คัดลอก URL ที่ได้มาใส่ในปุ่มด้านล่างนี้</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#64748b',
        confirmButtonText: '👉 กดใส่ Web App URL เพื่อส่งขึ้น Sheets',
        cancelButtonText: 'รับทราบ (บันทึกในเครื่องก่อน)'
      }).then((swalRes) => {
        if (swalRes.isConfirmed) {
          promptForGasUrl();
        }
      });
    } else {
      Swal.fire({ icon: 'error', title: 'ลงทะเบียนไม่สำเร็จ', text: result?.message || 'เกิดข้อผิดพลาด' });
    }
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-check-circle text-base mr-2"></i> ยืนยันการสมัครเข้าเวรจราจร`;
  }
}

// Live Search
function handleSearch(query) {
  const container = document.getElementById('searchResults');
  const clearBtn = document.getElementById('clearSearchBtn');
  const q = query.trim().toLowerCase();

  if (!q) {
    container.innerHTML = '';
    clearBtn.classList.add('hidden');
    return;
  }

  clearBtn.classList.remove('hidden');

  const matches = [];
  for (const [dayKey, day] of Object.entries(dutyData)) {
    for (const member of (day.members || [])) {
      if (member.name.toLowerCase().includes(q)) {
        matches.push({
          dayName: day.name,
          dayKey,
          name: member.name,
          role: member.isLocked ? `${member.role} (สมาชิกเดิม)` : 'สมัครผ่านเว็บ',
          gender: member.gender,
          time: member.time
        });
      }
    }
  }

  if (matches.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
        <i class="fa-solid fa-user-slash text-base mb-1 block"></i>
        ไม่พบรายชื่อที่ค้นหา "${query}"
      </div>
    `;
    return;
  }

  let html = '';
  for (const m of matches) {
    const theme = DAY_THEMES[m.dayKey];
    html += `
      <div class="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between transition">
        <div>
          <div class="font-semibold text-slate-800 flex items-center gap-1.5">
            <span>${m.name}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded ${m.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}">
              ${m.gender === 'female' ? 'หญิง' : 'ชาย'}
            </span>
          </div>
          <div class="text-[11px] text-slate-500 mt-0.5">
            ${m.role} ${m.time ? `• ${m.time}` : ''}
          </div>
        </div>
        <span class="text-xs font-bold px-2.5 py-1 rounded-lg ${theme.badge} border ${theme.border}">
          ${m.dayName}
        </span>
      </div>
    `;
  }

  container.innerHTML = html;
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  if (input) {
    input.value = '';
    handleSearch('');
    input.focus();
  }
}

// Modal: View Member List (READ ONLY for Applicants)
function toggleMemberListModal() {
  const modal = document.getElementById('memberListModal');
  if (modal.classList.contains('hidden')) {
    openMemberListModal(selectedDayKey);
  } else {
    modal.classList.add('hidden');
  }
}

function openMemberListModal(dayKey = 'monday') {
  currentModalTab = dayKey;
  const modal = document.getElementById('memberListModal');
  modal.classList.remove('hidden');

  renderModalDayTabs();
  renderModalDayContent(currentModalTab);
}

function renderModalDayTabs() {
  const container = document.getElementById('modalDayTabs');
  if (!container) return;

  let html = '';
  for (const [key, day] of Object.entries(dutyData)) {
    const isCurrent = currentModalTab === key;
    const stats = day.stats;
    const theme = DAY_THEMES[key];

    let tabClasses = `px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-t border-x `;
    if (isCurrent) {
      tabClasses += `bg-white text-indigo-700 border-slate-200 shadow-sm `;
    } else {
      tabClasses += `bg-transparent text-slate-600 border-transparent hover:text-slate-900 `;
    }

    html += `
      <div onclick="switchModalTab('${key}')" class="${tabClasses}">
        <span class="w-2.5 h-2.5 rounded-full ${theme.pill}"></span>
        <span>${day.name}</span>
        <span class="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
          ${stats.currentTotal}/${stats.maxTotal}
        </span>
      </div>
    `;
  }

  container.innerHTML = html;
}

function switchModalTab(key) {
  currentModalTab = key;
  renderModalDayTabs();
  renderModalDayContent(key);
}

function renderModalDayContent(key) {
  const container = document.getElementById('modalTableContent');
  const day = dutyData[key];
  if (!container || !day) return;

  const stats = day.stats;
  const theme = DAY_THEMES[key];

  let rowsHtml = '';
  let index = 1;

  for (const member of (day.members || [])) {
    const isLeader = member.role.includes('หัวหน้า');
    rowsHtml += `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100 ${member.isLocked ? '' : 'bg-indigo-50/20'}">
        <td class="py-3 px-3 text-slate-400 font-mono text-center w-12">${index++}</td>
        <td class="py-3 px-3 font-semibold ${member.isLocked ? 'text-slate-800' : 'text-indigo-900'}">
          ${member.name}
        </td>
        <td class="py-3 px-3 text-center">
          <span class="text-[11px] font-medium px-2 py-0.5 rounded-md ${member.gender === 'female' ? 'bg-pink-100 text-pink-700 border border-pink-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}">
            ${member.gender === 'female' ? 'หญิง' : 'ชาย'}
          </span>
        </td>
        <td class="py-3 px-3">
          ${member.isLocked 
            ? `<span class="text-[11px] font-semibold px-2 py-0.5 rounded-md ${isLeader ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700 border border-slate-200'}"><i class="fa-solid fa-lock text-[10px] mr-1"></i>${member.role}</span>`
            : `<span class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200"><i class="fa-solid fa-check text-[10px] mr-1"></i>สมัครผ่านเว็บ</span>`
          }
        </td>
        <td class="py-3 px-3 text-xs text-slate-500 font-mono">${member.phone || '-'}</td>
        <td class="py-3 px-3 text-xs text-slate-500">${member.time || '-'}</td>
      </tr>
    `;
  }

  container.innerHTML = `
    <div class="space-y-4">
      <div class="p-4 rounded-xl ${theme.accentBg} border ${theme.border} flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 class="font-bold text-slate-900 text-base font-['Kanit'] flex items-center gap-2">
            <span>เวรจราจร - ${day.name}</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium ${stats.isTotalFull ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
              ${stats.isTotalFull ? 'เต็มแล้ว' : `เปิดรับ (ว่าง ${stats.remainingTotal} ที่)`}
            </span>
          </h4>
          <p class="text-xs text-slate-600 mt-1">
            สมาชิกสูงสุด: <strong>${stats.maxTotal} คน</strong> | สมาชิกปัจจุบัน: <strong>${stats.currentTotal} คน</strong>
          </p>
        </div>
        <div class="text-right text-xs">
          <div class="font-medium text-slate-700">โควต้าเพศหญิง</div>
          <div class="${stats.isFemaleFull ? 'text-rose-600 font-bold' : 'text-slate-600 font-semibold'}">
            ${stats.currentFemale} / ${stats.femaleQuota} คน ${stats.isFemaleFull ? '(เต็มแล้ว)' : `(ว่าง ${stats.remainingFemale} ที่)`}
          </div>
        </div>
      </div>

      <div class="overflow-x-auto border border-slate-200 rounded-xl">
        <table class="w-full text-xs text-left">
          <thead class="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
            <tr>
              <th class="py-2.5 px-3 text-center">ลำดับ</th>
              <th class="py-2.5 px-3">ชื่อ - นามสกุล</th>
              <th class="py-2.5 px-3 text-center">เพศ</th>
              <th class="py-2.5 px-3">ประเภท / ตำแหน่ง</th>
              <th class="py-2.5 px-3">เบอร์ติดต่อ</th>
              <th class="py-2.5 px-3">เวลาที่ลงทะเบียน</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
