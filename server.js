import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const SPREADSHEET_ID = '1boXS84v-x2c7Nf29EorwiPc7vZ07Dpzva3ASxE5JoTQ';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Day Configurations
const DAY_CONFIG = {
  monday: { key: 'monday', name: 'วันจันทร์', sheetName: 'วันจันทร์', maxTotal: 20, femaleQuota: 10 },
  tuesday: { key: 'tuesday', name: 'วันอังคาร', sheetName: 'วันอังคาร', maxTotal: 20, femaleQuota: 10 },
  wednesday: { key: 'wednesday', name: 'วันพุธ', sheetName: 'วันพุธ', maxTotal: 20, femaleQuota: 10 },
  thursday: { key: 'thursday', name: 'วันพฤหัสบดี', sheetName: 'วันพฤหัสบดี', maxTotal: 20, femaleQuota: 10 },
  friday: { key: 'friday', name: 'วันศุกร์', sheetName: 'วันศุกร์', maxTotal: 20, femaleQuota: 10 }
};

// Initialize Google Sheets Auth using credentials from "Text Document ใหม่.txt"
function getSheetsClient() {
  const rawText = fs.readFileSync(path.join(__dirname, 'Text Document ใหม่.txt'), 'utf-8');
  const jsonMatch = rawText.match(/\{[\s\S]*"type":\s*"service_account"[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('ไม่พบข้อมูล Service Account ใน Text Document ใหม่.txt');
  }
  const sa = JSON.parse(jsonMatch[0]);

  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return google.sheets({ version: 'v4', auth });
}

// 1. Get Admin Password from Google Sheets
async function getAdminPassword(sheets) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'ตั้งค่าระบบ'!A2:B3`
    });
    const rows = res.data.values || [];
    for (const r of rows) {
      if (r[0] === 'admin_password') {
        return r[1] || 'admin1234';
      }
    }
  } catch (err) {
    console.error('Password read error:', err.message);
  }
  return 'admin1234';
}

// 2. Read All Duty Data directly from Google Sheets
async function readAllDutyData(sheets) {
  const result = {};

  for (const [key, cfg] of Object.entries(DAY_CONFIG)) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${cfg.sheetName}'!A5:F40`
    });

    const rows = res.data.values || [];
    const members = [];
    let lockedCount = 0;
    let lockedFemaleCount = 0;
    let regCount = 0;
    let regFemaleCount = 0;

    rows.forEach((row, idx) => {
      const name = (row[1] || '').toString().trim();
      if (!name) return;

      const genderText = (row[2] || '').toString().trim();
      const isFemale = genderText === 'หญิง' || genderText.toLowerCase() === 'female';
      const roleText = (row[3] || '').toString().trim();
      const phone = (row[4] || '-').toString().trim();
      const time = (row[5] || '-').toString().trim();
      const isLocked = roleText.includes('(ล็อค)') || time === 'กำหนดล่วงหน้า';

      const memberObj = {
        id: `row-${idx + 5}`,
        rowIndex: idx + 5,
        order: row[0] || (idx + 1),
        name,
        gender: isFemale ? 'female' : 'male',
        role: roleText,
        phone,
        time,
        isLocked
      };

      members.push(memberObj);

      if (isLocked) {
        lockedCount++;
        if (isFemale) lockedFemaleCount++;
      } else {
        regCount++;
        if (isFemale) regFemaleCount++;
      }
    });

    const currentTotal = lockedCount + regCount;
    const currentFemale = lockedFemaleCount + regFemaleCount;
    const remainingTotal = Math.max(0, cfg.maxTotal - currentTotal);
    const remainingFemale = Math.max(0, cfg.femaleQuota - currentFemale);

    result[key] = {
      key,
      name: cfg.name,
      sheetName: cfg.sheetName,
      maxTotal: cfg.maxTotal,
      femaleQuota: cfg.femaleQuota,
      members,
      lockedMembers: members.filter(m => m.isLocked),
      registrations: members.filter(m => !m.isLocked),
      stats: {
        dayKey: key,
        dayName: cfg.name,
        maxTotal: cfg.maxTotal,
        femaleQuota: cfg.femaleQuota,
        lockedTotal: lockedCount,
        lockedFemale: lockedFemaleCount,
        regTotal: regCount,
        regFemale: regFemaleCount,
        currentTotal,
        currentFemale,
        remainingTotal,
        remainingFemale,
        isTotalFull: currentTotal >= cfg.maxTotal,
        isFemaleFull: currentFemale >= cfg.femaleQuota
      }
    };
  }

  return result;
}

// 3. Update Summary Overview Sheet
async function updateOverviewSheet(sheets) {
  const currentData = await readAllDutyData(sheets);
  const summaryValues = [
    ['สรุปยอดการสมัครเวรจราจร ประจำสัปดาห์', '', '', '', '', '', '', ''],
    ['อัปเดตล่าสุด: ' + new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }), '', '', '', '', '', '', ''],
    ['วัน', 'สมาชิกสูงสุด', 'สมาชิกปัจจุบัน', 'คงเหลือ (ที่ว่าง)', 'โควต้าหญิง', 'หญิงปัจจุบัน', 'โควต้าหญิงคงเหลือ', 'สถานะ']
  ];

  let totalMax = 0;
  let totalCurrent = 0;
  let totalFemaleQuota = 0;
  let totalFemaleCurrent = 0;

  for (const [key, day] of Object.entries(currentData)) {
    const stats = day.stats;
    totalMax += stats.maxTotal;
    totalCurrent += stats.currentTotal;
    totalFemaleQuota += stats.femaleQuota;
    totalFemaleCurrent += stats.currentFemale;

    let statusText = 'เปิดรับสมัคร';
    if (stats.isTotalFull) {
      statusText = 'เต็มแล้ว';
    } else if (stats.isFemaleFull) {
      statusText = 'รับเฉพาะชาย (โควต้าหญิงเต็ม)';
    }

    summaryValues.push([
      stats.dayName,
      stats.maxTotal,
      stats.currentTotal,
      stats.remainingTotal,
      stats.femaleQuota,
      stats.currentFemale,
      stats.remainingFemale,
      statusText
    ]);
  }

  summaryValues.push([
    'รวมทั้งหมด',
    totalMax,
    totalCurrent,
    Math.max(0, totalMax - totalCurrent),
    totalFemaleQuota,
    totalFemaleCurrent,
    Math.max(0, totalFemaleQuota - totalFemaleCurrent),
    totalCurrent >= totalMax ? 'เต็มทุกวัน' : 'เปิดรับสมัคร'
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'สรุปภาพรวม'!A1:H10`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: summaryValues }
  });
}

// ----------------- API ROUTES -----------------

// GET /api/duty-data
app.get('/api/duty-data', async (req, res) => {
  try {
    const sheets = getSheetsClient();
    const data = await readAllDutyData(sheets);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Fetch duty error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/register (Writes directly to Google Sheets!)
app.post('/api/register', async (req, res) => {
  try {
    const { dayKey, prefix, fullName, gender, phone, note } = req.body;
    if (!dayKey || !fullName || !gender) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน (วัน, ชื่อ-นามสกุล, เพศ)' });
    }

    const sheets = getSheetsClient();
    const currentData = await readAllDutyData(sheets);
    const day = currentData[dayKey];
    if (!day) return res.status(400).json({ success: false, message: 'ไม่พบวันดังกล่าว' });

    const stats = day.stats;
    const isFemale = gender === 'female';

    if (stats.isTotalFull) {
      return res.status(400).json({ success: false, message: `${day.name} สมาชิกเต็มแล้ว (${stats.maxTotal} คน)` });
    }
    if (isFemale && stats.isFemaleFull) {
      return res.status(400).json({ success: false, message: `โควต้าหญิงสำหรับ ${day.name} เต็มแล้ว (${stats.femaleQuota} คน)` });
    }

    // Check duplicate
    const duplicate = day.members.some(m => m.name.toLowerCase() === fullName.trim().toLowerCase());
    if (duplicate) {
      return res.status(400).json({ success: false, message: `ชื่อ "${fullName.trim()}" มีรายชื่ออยู่ใน ${day.name} แล้ว` });
    }

    const cleanName = `${prefix ? prefix.trim() + ' ' : ''}${fullName.trim()}`;
    const nextOrder = day.members.length + 1;
    const nowStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

    const newRow = [
      nextOrder,
      cleanName,
      isFemale ? 'หญิง' : 'ชาย',
      'สมาชิก (สมัครผ่านเว็บ)',
      phone ? phone.trim() : '-',
      nowStr
    ];

    // Append directly to Google Sheets!
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${day.sheetName}'!A5:F`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [newRow] }
    });

    console.log(`[Google Sheets Success] Added ${cleanName} to ${day.name}`);

    // Update Overview Summary Sheet
    await updateOverviewSheet(sheets);

    const updatedData = await readAllDutyData(sheets);
    res.json({
      success: true,
      message: `ลงทะเบียนเข้าเวร ${day.name} เรียบร้อยแล้ว! บันทึกลง Google Sheets สำเร็จ`,
      data: updatedData
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    const sheets = getSheetsClient();
    const currentPass = await getAdminPassword(sheets);

    if (password === currentPass) {
      res.json({ success: true, message: 'เข้าสู่ระบบสำเร็จ' });
    } else {
      res.status(401).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้น: admin1234)' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/change-password
app.post('/api/admin/change-password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const sheets = getSheetsClient();
    const currentPass = await getAdminPassword(sheets);

    if (oldPassword !== currentPass) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    }
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' });
    }

    const nowStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'ตั้งค่าระบบ'!B2:D2`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newPassword, 'รหัสผ่านสำหรับเข้าสู่ระบบ Admin', nowStr]]
      }
    });

    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านใน Google Sheets เรียบร้อยแล้ว' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/member/:dayKey/:rowIndex
app.delete('/api/admin/member/:dayKey/:rowIndex', async (req, res) => {
  try {
    const { dayKey, rowIndex } = req.params;
    const { adminPassword } = req.body;
    const sheets = getSheetsClient();

    const currentPass = await getAdminPassword(sheets);
    if (adminPassword !== currentPass) {
      return res.status(401).json({ success: false, message: 'ไม่มีสิทธิ์ดำเนินการ หรือรหัสผ่าน Admin ไม่ถูกต้อง' });
    }

    const cfg = DAY_CONFIG[dayKey];
    if (!cfg) return res.status(400).json({ success: false, message: 'ไม่พบวันดังกล่าว' });

    const info = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetObj = info.data.sheets.find(s => s.properties.title === cfg.sheetName);
    if (!sheetObj) return res.status(400).json({ success: false, message: `ไม่พบชีต ${cfg.sheetName}` });

    const sheetId = sheetObj.properties.sheetId;
    const targetRow = parseInt(rowIndex, 10);
    if (isNaN(targetRow) || targetRow < 5) return res.status(400).json({ success: false, message: 'แถวไม่ถูกต้อง' });

    // Delete row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: targetRow - 1,
                endIndex: targetRow
              }
            }
          }
        ]
      }
    });

    // Re-sequence numbers
    const updatedRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${cfg.sheetName}'!A5:F40`
    });
    const currentRows = updatedRes.data.values || [];
    if (currentRows.length > 0) {
      const renumbered = currentRows.map((r, i) => [i + 1, r[1] || '', r[2] || '', r[3] || '', r[4] || '', r[5] || '']);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${cfg.sheetName}'!A5:F${4 + renumbered.length}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: renumbered }
      });
    }

    await updateOverviewSheet(sheets);
    const updatedData = await readAllDutyData(sheets);

    res.json({ success: true, message: 'ลบรายชื่อออกจาก Google Sheets เรียบร้อยแล้ว', data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`   ระบบสมัครเข้าเวรจราจร ทำงานอยู่ที่:`);
  console.log(`   👉 http://localhost:${PORT}`);
  console.log(`   👉 http://localhost:${PORT}/admin.html (แอดมิน)`);
  console.log(`   เชื่อมต่อ Google Sheets: ${SPREADSHEET_ID}`);
  console.log(`====================================================`);
});

