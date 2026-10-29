/**
 * =========================================================================
 * ระบบสมัครเข้าเวรจราจร (Traffic Duty Registration System) - Google Apps Script
 * =========================================================================
 * วางโค้ดนี้ลงใน:
 * 1. เปิด Google Sheets -> เมนู "ส่วนขยาย" (Extensions) -> "Apps Script"
 * 2. ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดนี้ลงไป
 * 3. กด "บันทึก" (Save / รูปแผ่นดิสก์)
 * 4. กดปุ่มสีน้ำเงิน "การทำให้ใช้งานได้" (Deploy) -> "รายการใหม่" (New deployment)
 * 5. เลือกประเภท: "เว็บแอป" (Web app)
 *    - คำอธิบาย: Traffic Duty API
 *    - ดำเนินการในฐานะ: "ฉัน" (Me)
 *    - ผู้มีสิทธิ์เข้าถึง: "ทุกคน" (Anyone) **สำคัญมาก!**
 * 6. กด "ทำให้ใช้งานได้" (Deploy) แล้วคัดลอก "URL ของเว็บแอป" (Web App URL)
 *    นำมาใส่ในไฟล์ config.js สำหรับใช้งานบน GitHub Pages
 * =========================================================================
 */

const DAY_CONFIG = {
  monday: { key: 'monday', name: 'วันจันทร์', sheetName: 'วันจันทร์', maxTotal: 20, femaleQuota: 10 },
  tuesday: { key: 'tuesday', name: 'วันอังคาร', sheetName: 'วันอังคาร', maxTotal: 20, femaleQuota: 10 },
  wednesday: { key: 'wednesday', name: 'วันพุธ', sheetName: 'วันพุธ', maxTotal: 20, femaleQuota: 10 },
  thursday: { key: 'thursday', name: 'วันพฤหัสบดี', sheetName: 'วันพฤหัสบดี', maxTotal: 20, femaleQuota: 10 },
  friday: { key: 'friday', name: 'วันศุกร์', sheetName: 'วันศุกร์', maxTotal: 20, femaleQuota: 10 }
};

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'getData';
  
  if (action === 'getData') {
    const data = getAllDutyData();
    return createJsonResponse({ success: true, data: data });
  }
  
  if (action === 'verifyPassword') {
    const pass = e.parameter.password || '';
    const currentPass = getAdminPassword();
    return createJsonResponse({ success: pass === currentPass });
  }

  return createJsonResponse({ success: false, message: 'Invalid action' });
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    const action = payload.action;

    // 1. Applicant Register
    if (action === 'register') {
      const res = handleRegister(payload);
      return createJsonResponse(res);
    }

    // 2. Admin Login
    if (action === 'login') {
      const currentPass = getAdminPassword();
      if (payload.password === currentPass) {
        return createJsonResponse({ success: true, message: 'เข้าสู่ระบบสำเร็จ' });
      } else {
        return createJsonResponse({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' });
      }
    }

    // 3. Admin Change Password
    if (action === 'changePassword') {
      const currentPass = getAdminPassword();
      if (payload.oldPassword !== currentPass) {
        return createJsonResponse({ success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
      }
      if (!payload.newPassword || payload.newPassword.length < 4) {
        return createJsonResponse({ success: false, message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร' });
      }
      setAdminPassword(payload.newPassword);
      return createJsonResponse({ success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
    }

    // 4. Admin Delete Member
    if (action === 'deleteMember') {
      const currentPass = getAdminPassword();
      if (payload.adminPassword !== currentPass) {
        return createJsonResponse({ success: false, message: 'ไม่มีสิทธิ์ดำเนินการ หรือรหัสผ่านผิด' });
      }
      const res = handleDeleteMember(payload.dayKey, payload.rowIndex);
      return createJsonResponse(res);
    }

    return createJsonResponse({ success: false, message: 'Unknown action: ' + action });
  } catch (err) {
    return createJsonResponse({ success: false, message: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

const SPREADSHEET_ID = '1boXS84v-x2c7Nf29EorwiPc7vZ07Dpzva3ASxE5JoTQ';

function getSpreadsheet() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
}

// Read All Data from Sheets
function getAllDutyData() {
  const ss = getSpreadsheet();
  const result = {};

  for (const key in DAY_CONFIG) {
    const cfg = DAY_CONFIG[key];
    const sheet = ss.getSheetByName(cfg.sheetName);
    const members = [];
    let lockedCount = 0;
    let lockedFemaleCount = 0;
    let regCount = 0;
    let regFemaleCount = 0;

    if (sheet) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= 5) {
        const values = sheet.getRange(5, 1, lastRow - 4, 6).getValues();
        for (let i = 0; i < values.length; i++) {
          const row = values[i];
          const name = (row[1] || '').toString().trim();
          if (!name) continue;

          const genderText = (row[2] || '').toString().trim();
          const isFemale = genderText === 'หญิง' || genderText.toLowerCase() === 'female';
          const role = (row[3] || '').toString().trim();
          const phone = (row[4] || '-').toString().trim();
          const time = (row[5] || '-').toString().trim();
          const isLocked = role.indexOf('(ล็อค)') !== -1 || time === 'กำหนดล่วงหน้า';

          const memberObj = {
            id: 'row-' + (i + 5),
            rowIndex: i + 5,
            order: row[0] || (i + 1),
            name: name,
            gender: isFemale ? 'female' : 'male',
            role: role,
            phone: phone,
            time: time,
            isLocked: isLocked
          };

          members.push(memberObj);

          if (isLocked) {
            lockedCount++;
            if (isFemale) lockedFemaleCount++;
          } else {
            regCount++;
            if (isFemale) regFemaleCount++;
          }
        }
      }
    }

    const currentTotal = lockedCount + regCount;
    const currentFemale = lockedFemaleCount + regFemaleCount;
    const remainingTotal = Math.max(0, cfg.maxTotal - currentTotal);
    const remainingFemale = Math.max(0, cfg.femaleQuota - currentFemale);

    result[key] = {
      key: key,
      name: cfg.name,
      sheetName: cfg.sheetName,
      maxTotal: cfg.maxTotal,
      femaleQuota: cfg.femaleQuota,
      members: members,
      lockedMembers: members.filter(function(m) { return m.isLocked; }),
      registrations: members.filter(function(m) { return !m.isLocked; }),
      stats: {
        dayKey: key,
        dayName: cfg.name,
        maxTotal: cfg.maxTotal,
        femaleQuota: cfg.femaleQuota,
        lockedTotal: lockedCount,
        lockedFemale: lockedFemaleCount,
        regTotal: regCount,
        regFemale: regFemaleCount,
        currentTotal: currentTotal,
        currentFemale: currentFemale,
        remainingTotal: remainingTotal,
        remainingFemale: remainingFemale,
        isTotalFull: currentTotal >= cfg.maxTotal,
        isFemaleFull: currentFemale >= cfg.femaleQuota
      }
    };
  }

  return result;
}

// Handle Registration
function handleRegister(payload) {
  const ss = getSpreadsheet();
  const dayKey = payload.dayKey;
  const cfg = DAY_CONFIG[dayKey];
  if (!cfg) throw new Error('ไม่พบข้อมูลวัน');

  const allData = getAllDutyData();
  const dayData = allData[dayKey];
  const isFemale = payload.gender === 'female';

  if (dayData.stats.isTotalFull) {
    throw new Error(cfg.name + ' สมาชิกเต็มแล้ว (' + cfg.maxTotal + ' คน)');
  }
  if (isFemale && dayData.stats.isFemaleFull) {
    throw new Error('โควต้าหญิงสำหรับ ' + cfg.name + ' เต็มแล้ว (' + cfg.femaleQuota + ' คน)');
  }

  // Duplicate Check
  for (let i = 0; i < dayData.members.length; i++) {
    if (dayData.members[i].name.toLowerCase() === payload.fullName.trim().toLowerCase()) {
      throw new Error('ชื่อ "' + payload.fullName.trim() + '" มีรายชื่ออยู่ใน ' + cfg.name + ' แล้ว');
    }
  }

  const sheet = ss.getSheetByName(cfg.sheetName);
  const nextOrder = dayData.members.length + 1;
  const cleanName = (payload.prefix ? payload.prefix.trim() + ' ' : '') + payload.fullName.trim();
  const timeStr = Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy HH:mm:ss');

  sheet.appendRow([
    nextOrder,
    cleanName,
    isFemale ? 'หญิง' : 'ชาย',
    'สมาชิก (สมัครผ่านเว็บ)',
    payload.phone ? payload.phone.trim() : '-',
    timeStr
  ]);

  updateOverviewSheet(ss);

  return {
    success: true,
    message: 'ลงทะเบียนเข้าเวร ' + cfg.name + ' เรียบร้อยแล้ว!',
    data: getAllDutyData()
  };
}

// Handle Delete Member (Admin)
function handleDeleteMember(dayKey, rowIndex) {
  const ss = getSpreadsheet();
  const cfg = DAY_CONFIG[dayKey];
  if (!cfg) throw new Error('ไม่พบข้อมูลวัน');

  const sheet = ss.getSheetByName(cfg.sheetName);
  const rIndex = parseInt(rowIndex, 10);
  if (isNaN(rIndex) || rIndex < 5) throw new Error('ตำแหน่งแถวไม่ถูกต้อง');

  sheet.deleteRow(rIndex);

  // Re-number rows
  const lastRow = sheet.getLastRow();
  if (lastRow >= 5) {
    const range = sheet.getRange(5, 1, lastRow - 4, 1);
    const orders = [];
    for (let i = 1; i <= lastRow - 4; i++) {
      orders.push([i]);
    }
    range.setValues(orders);
  }

  updateOverviewSheet(ss);

  return {
    success: true,
    message: 'ลบรายชื่อออกจาก Google Sheets เรียบร้อยแล้ว',
    data: getAllDutyData()
  };
}

// Get Admin Password
function getAdminPassword() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('ตั้งค่าระบบ');
  if (!sheet) {
    sheet = ss.insertSheet('ตั้งค่าระบบ');
    sheet.appendRow(['การตั้งค่า', 'ค่าที่กำหนด', 'คำอธิบาย', 'แก้ไขล่าสุด']);
    sheet.appendRow(['admin_password', 'admin1234', 'รหัสผ่าน Admin', new Date()]);
    return 'admin1234';
  }
  const val = sheet.getRange('B2').getValue();
  return val ? val.toString().trim() : 'admin1234';
}

// Set Admin Password
function setAdminPassword(newPassword) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('ตั้งค่าระบบ');
  if (!sheet) {
    sheet = ss.insertSheet('ตั้งค่าระบบ');
    sheet.appendRow(['การตั้งค่า', 'ค่าที่กำหนด', 'คำอธิบาย', 'แก้ไขล่าสุด']);
  }
  const timeStr = Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy HH:mm:ss');
  sheet.getRange('B2').setValue(newPassword);
  sheet.getRange('D2').setValue(timeStr);
}

// Update Overview Sheet
function updateOverviewSheet(ss) {
  const overviewSheet = ss.getSheetByName('สรุปภาพรวม');
  if (!overviewSheet) return;

  const allData = getAllDutyData();
  let row = 4;
  let totalMax = 0;
  let totalCurrent = 0;
  let totalFemaleQuota = 0;
  let totalFemaleCurrent = 0;

  for (const key in DAY_CONFIG) {
    const day = allData[key];
    const stats = day.stats;
    totalMax += stats.maxTotal;
    totalCurrent += stats.currentTotal;
    totalFemaleQuota += stats.femaleQuota;
    totalFemaleCurrent += stats.currentFemale;

    let status = 'เปิดรับสมัคร';
    if (stats.isTotalFull) {
      status = 'เต็มแล้ว';
    } else if (stats.isFemaleFull) {
      status = 'รับเฉพาะชาย (โควต้าหญิงเต็ม)';
    }

    overviewSheet.getRange(row, 1, 1, 8).setValues([[
      stats.dayName,
      stats.maxTotal,
      stats.currentTotal,
      stats.remainingTotal,
      stats.femaleQuota,
      stats.currentFemale,
      stats.remainingFemale,
      status
    ]]);
    row++;
  }

  // Total Row
  overviewSheet.getRange(row, 1, 1, 8).setValues([[
    'รวมทั้งหมด',
    totalMax,
    totalCurrent,
    Math.max(0, totalMax - totalCurrent),
    totalFemaleQuota,
    totalFemaleCurrent,
    Math.max(0, totalFemaleQuota - totalFemaleCurrent),
    totalCurrent >= totalMax ? 'เต็มทุกวัน' : 'เปิดรับสมัคร'
  ]]);
  
  // Update timestamp
  const timeStr = Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy HH:mm:ss');
  overviewSheet.getRange('A2').setValue('อัปเดตล่าสุด: ' + timeStr);
}

