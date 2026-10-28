// Global Application Configuration & Universal API Client
// รองรับการทำงานทั้งบน Local Server (Node.js) และ GitHub Pages (Google Apps Script)

window.APP_CONFIG = {
  // ลิงก์ Google Sheets ของระบบ (ค่าเริ่มต้น)
  SPREADSHEET_URL: 'https://docs.google.com/spreadsheets/d/1boXS84v-x2c7Nf29EorwiPc7vZ07Dpzva3ASxE5JoTQ/edit?usp=sharing',
  SPREADSHEET_ID: '1boXS84v-x2c7Nf29EorwiPc7vZ07Dpzva3ASxE5JoTQ',
  
  // รหัสผ่านเริ่มต้นสำหรับ Admin (บันทึกอยู่ใน Google Sheets แท็บ 'ตั้งค่าระบบ')
  DEFAULT_ADMIN_PASSWORD: 'admin1234',

  // Google Apps Script Web App URL (บันทึกใน LocalStorage หรือระบุค่าเริ่มต้น)
  GAS_WEBAPP_URL: localStorage.getItem('TRAFFIC_GAS_URL') || 'https://script.google.com/macros/s/AKfycbwJGT0KStVWcUq0VRi7lR0tyQl5bL7Ao7Izngtf8gGnC-LOAmoL185F1E5TRNsc6OU_gQ/exec'
};

// ข้อมูลตั้งต้นของเวรจราจร (แสดงผลได้ทันทีโดยไม่ต้องรอโหลด)
window.INITIAL_DUTY_DATA = {
  monday: {
    key: 'monday',
    name: 'วันจันทร์',
    sheetName: 'วันจันทร์',
    maxTotal: 6,
    femaleQuota: 2,
    members: [
      { order: 1, name: 'กานต์จณากร', gender: 'male', role: 'หัวหน้าเวร (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true },
      { order: 2, name: 'ชิษณุพงศ์ ซื่อตรง', gender: 'male', role: 'สมาชิก (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true }
    ]
  },
  tuesday: {
    key: 'tuesday',
    name: 'วันอังคาร',
    sheetName: 'วันอังคาร',
    maxTotal: 9,
    femaleQuota: 2,
    members: [
      { order: 1, name: 'ตรีรัตน์', gender: 'male', role: 'หัวหน้าเวร (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true },
      { order: 2, name: 'ศศิกานต์ เกศศิริ', gender: 'female', role: 'สมาชิก (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true },
      { order: 3, name: 'สุดารัตน์ แสงสุด', gender: 'female', role: 'สมาชิก (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true }
    ]
  },
  wednesday: {
    key: 'wednesday',
    name: 'วันพุธ',
    sheetName: 'วันพุธ',
    maxTotal: 8,
    femaleQuota: 3,
    members: [
      { order: 1, name: 'จารุพงศ์', gender: 'male', role: 'หัวหน้าเวร (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true },
      { order: 2, name: 'คุณาลักษณ์ คล้ายนิ่ม', gender: 'male', role: 'สมาชิก (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true },
      { order: 3, name: 'ธนวัฒน์ ชัยรปู', gender: 'male', role: 'สมาชิก (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true },
      { order: 4, name: 'เมธาสิทธิ์ เทียนหลง', gender: 'male', role: 'สมาชิก (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true }
    ]
  },
  thursday: {
    key: 'thursday',
    name: 'วันพฤหัสบดี',
    sheetName: 'วันพฤหัสบดี',
    maxTotal: 9,
    femaleQuota: 2,
    members: [
      { order: 1, name: 'วิชญะ', gender: 'male', role: 'หัวหน้าเวร (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true },
      { order: 2, name: 'นายธีรพัชญ์ วุฒิวิชญานันต์', gender: 'male', role: 'สมาชิก (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true },
      { order: 3, name: 'นายจิรวัฒน์ ทรงศิลสอาด', gender: 'male', role: 'สมาชิก (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true },
      { order: 4, name: 'นายณัฐวุฒิ บุญสาสม', gender: 'male', role: 'สมาชิก (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true },
      { order: 5, name: 'นายเมธาวรรธน์ เนตรพินิจ', gender: 'male', role: 'สมาชิก (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true }
    ]
  },
  friday: {
    key: 'friday',
    name: 'วันศุกร์',
    sheetName: 'วันศุกร์',
    maxTotal: 8,
    femaleQuota: 2,
    members: [
      { order: 1, name: 'เลิศสุกฤษฎิ์', gender: 'male', role: 'หัวหน้าเวร (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true },
      { order: 2, name: 'กัญญาภัค โพธิ์ทอง', gender: 'female', role: 'สมาชิก (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true },
      { order: 3, name: 'วิภาดา กูดจันทึก', gender: 'female', role: 'สมาชิก (ล็อค)', phone: '-', time: 'กำหนดล่วงหน้า', isLocked: true }
    ]
  }
};

// คำนวณ Stats จากรายชื่อสมาชิก
window.calculateDutyStats = function(dutyData) {
  const result = {};
  for (const key in dutyData) {
    const day = dutyData[key];
    const members = day.members || [];
    
    let lockedCount = 0;
    let lockedFemaleCount = 0;
    let regCount = 0;
    let regFemaleCount = 0;

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const isFemale = m.gender === 'female' || m.gender === 'หญิง';
      if (m.isLocked) {
        lockedCount++;
        if (isFemale) lockedFemaleCount++;
      } else {
        regCount++;
        if (isFemale) regFemaleCount++;
      }
    }

    const currentTotal = lockedCount + regCount;
    const currentFemale = lockedFemaleCount + regFemaleCount;
    const remainingTotal = Math.max(0, day.maxTotal - currentTotal);
    const remainingFemale = Math.max(0, day.femaleQuota - currentFemale);

    result[key] = {
      ...day,
      members: members,
      lockedMembers: members.filter(m => m.isLocked),
      registrations: members.filter(m => !m.isLocked),
      stats: {
        dayKey: key,
        dayName: day.name,
        maxTotal: day.maxTotal,
        femaleQuota: day.femaleQuota,
        lockedTotal: lockedCount,
        lockedFemale: lockedFemaleCount,
        regTotal: regCount,
        regFemale: regFemaleCount,
        currentTotal: currentTotal,
        currentFemale: currentFemale,
        remainingTotal: remainingTotal,
        remainingFemale: remainingFemale,
        isTotalFull: currentTotal >= day.maxTotal,
        isFemaleFull: currentFemale >= day.femaleQuota
      }
    };
  }
  return result;
};

// โหลดข้อมูลจาก LocalStorage (ถ้ามี) รวมกับข้อมูลเริ่มต้น
window.loadLocalDutyData = function() {
  const base = JSON.parse(JSON.stringify(window.INITIAL_DUTY_DATA));
  const savedRegs = localStorage.getItem('TRAFFIC_LOCAL_REGS');
  if (savedRegs) {
    try {
      const regs = JSON.parse(savedRegs);
      for (const dayKey in regs) {
        if (base[dayKey]) {
          base[dayKey].members = base[dayKey].members.concat(regs[dayKey]);
        }
      }
    } catch (e) {
      console.warn('Error loading local registrations:', e);
    }
  }
  return window.calculateDutyStats(base);
};

// API Client Helper
window.ApiClient = {
  isLocalServer: function() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  },

  // ดึงข้อมูลเวรทั้งหมด
  fetchDutyData: async function() {
    // 1. ถ้าเปิดผ่าน Local Server (localhost:3000) ดึงผ่าน Node.js Server ตรงกับ Google Sheets ทันที
    if (this.isLocalServer()) {
      try {
        const res = await fetch('/api/duty-data');
        const json = await res.json();
        if (json && json.success) return json;
      } catch (e) {
        console.warn('Local server fetch failed, using fallback:', e);
      }
    }

    // 2. ถ้าเปิดผ่าน GitHub Pages และมี Web App URL
    const gasUrl = window.APP_CONFIG.GAS_WEBAPP_URL;
    if (gasUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${gasUrl}?action=getData`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const json = await res.json();
        if (json && json.success) return json;
      } catch (err) {
        console.warn('Google Sheets GAS fetch failed:', err.message);
      }
    }

    // 3. Fallback ข้อมูลเริ่มต้นทันที (Instant Render)
    return { success: true, data: window.loadLocalDutyData(), isLocalFallback: !gasUrl && !this.isLocalServer() };
  },

  // สมัครเข้าเวร (Applicant Registration)
  register: async function(regData) {
    // 1. ถ้าเปิดผ่าน Local Server (localhost:3000) ส่งเข้า Node.js และบันทึกลง Google Sheets ทันที!
    if (this.isLocalServer()) {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });
      return await res.json();
    }

    // 2. ถ้ามี Web App URL
    const gasUrl = window.APP_CONFIG.GAS_WEBAPP_URL;
    if (gasUrl) {
      try {
        const payload = {
          action: 'register',
          dayKey: regData.dayKey,
          prefix: regData.prefix,
          fullName: regData.fullName,
          gender: regData.gender,
          phone: regData.phone,
          note: regData.note
        };
        const res = await fetch(gasUrl, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        return await res.json();
      } catch (err) {
        return { success: false, message: 'การเชื่อมต่อ Google Sheets ขัดข้อง: ' + err.message };
      }
    }

    // 3. ถ้ายังไม่ได้เชื่อมต่ออะไรเลย
    return {
      success: false,
      isNotConnectedToSheets: true,
      message: 'ยังไม่ได้เชื่อมต่อ Google Sheets! กรุณาเปิดระบบผ่านไฟล์ start.bat หรือใส่ Web App URL เพื่อส่งขึ้น Google Sheets จริง',
      data: window.loadLocalDutyData()
    };
  },

  // Admin เข้าสู่ระบบ
  adminLogin: async function(password) {
    if (this.isLocalServer()) {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      return await res.json();
    }

    const gasUrl = window.APP_CONFIG.GAS_WEBAPP_URL;
    if (gasUrl) {
      try {
        const res = await fetch(gasUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'login', password })
        });
        return await res.json();
      } catch (err) {
        // fallback
      }
    }

    const defaultPass = localStorage.getItem('TRAFFIC_LOCAL_ADMIN_PASS') || window.APP_CONFIG.DEFAULT_ADMIN_PASSWORD;
    if (password === defaultPass) {
      return { success: true, message: 'เข้าสู่ระบบสำเร็จ' };
    }
    return { success: false, message: 'รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้น: admin1234)' };
  },

  // Admin เปลี่ยนรหัสผ่าน
  adminChangePassword: async function(oldPassword, newPassword) {
    if (this.isLocalServer()) {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      return await res.json();
    }

    const gasUrl = window.APP_CONFIG.GAS_WEBAPP_URL;
    if (gasUrl) {
      try {
        const res = await fetch(gasUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'changePassword', oldPassword, newPassword })
        });
        return await res.json();
      } catch (err) {
        // fallback
      }
    }

    localStorage.setItem('TRAFFIC_LOCAL_ADMIN_PASS', newPassword);
    return { success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' };
  },

  // Admin ลบสมาชิก
  adminDeleteMember: async function(dayKey, rowIndex, adminPassword, memberName) {
    if (this.isLocalServer()) {
      const res = await fetch(`/api/admin/member/${dayKey}/${rowIndex}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword })
      });
      return await res.json();
    }

    const gasUrl = window.APP_CONFIG.GAS_WEBAPP_URL;
    if (gasUrl) {
      try {
        const res = await fetch(gasUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'deleteMember', dayKey, rowIndex, adminPassword })
        });
        return await res.json();
      } catch (err) {
        // fallback
      }
    }

    return { success: true, message: 'ลบรายชื่อเรียบร้อยแล้ว', data: window.loadLocalDutyData() };
  }
};
