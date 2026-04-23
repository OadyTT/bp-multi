# BP-Multi — แอปวัดความดันหลายคนไข้

แอปบันทึกความดันโลหิต รองรับหลายคนไข้ เก็บข้อมูลในเครื่องเท่านั้น  
แยก GitHub / Vercel จากแอปเดิม (BPM-Tracker)

---

## ✨ Features
- 👥 **Multi-patient** — เพิ่ม/ลบ/แก้ไขคนไข้ได้หลายคน
- 💾 **Local-only** — ข้อมูลความดันเก็บใน localStorage เท่านั้น ไม่อัปโหลด server
- 📥 **Backup/Restore** — export JSON ทีละคน หรือทุกคนพร้อมกัน
- 🔒 **Trial / Full Version** — ทดลองใช้ 60 วัน, ปลดล็อคด้วยรหัสผ่านผ่าน Vercel API
- 📈 **Graph + Health Advice** — กราฟ 14 วัน, คำแนะนำสุขภาพ (Full Version)
- 🖨️ **Print/PDF/JPG** — พิมพ์รายงาน A4, บันทึกภาพ JPG (Full Version)
- 🌐 **TH/EN** — ภาษาไทย/อังกฤษ
- 📱 **PWA** — ติดตั้งเป็นแอปบนมือถือได้

---

## 🚀 Deploy ใหม่ (แยกจากแอปเดิม)

### 1. สร้าง GitHub repo ใหม่
```bash
mkdir bp-multi
cd bp-multi
git init
git remote add origin https://github.com/YOUR_USERNAME/bp-multi.git
```

### 2. Copy ไฟล์
```
bp-multi/
├── src/
│   ├── App.js          ← ไฟล์หลัก
│   └── index.js        ← (ใช้อันเดิมจาก CRA)
├── public/
│   └── index.html      ← (ใช้อันเดิมจาก CRA)
├── api/
│   ├── verify.js       ← Trial + Unlock API
│   └── notify.js       ← Payment notification API
├── package.json
└── README.md
```

### 3. สร้าง src/index.js
```js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
```

### 4. Deploy บน Vercel (ใหม่)
1. ไปที่ vercel.com → **New Project**
2. Import GitHub repo ที่สร้างใหม่
3. Framework: **Create React App**
4. **Environment Variables** (ตั้งใน Vercel dashboard):

| Key | Value | หมายเหตุ |
|-----|-------|----------|
| `UNLOCK_CODE` | `YOUR_CODE` | รหัสปลดล็อค (เปลี่ยนได้) |
| `ADMIN_PASS` | `YOUR_PASS` | รหัส Admin Panel |
| `TRIAL_SECRET` | `random-string-2025` | สตริงลับสำหรับ HMAC |

**Optional (สำหรับแจ้ง LINE เมื่อลูกค้าโอนเงิน):**

| Key | Value |
|-----|-------|
| `LINE_CHANNEL_TOKEN` | Channel Access Token จาก LINE Developers |
| `ADMIN_LINE_USER_ID` | LINE User ID ของ admin |

5. Deploy!

---

## 🔑 Storage Keys (แยกจากแอปเดิมทั้งหมด)

| Key | เก็บอะไร |
|-----|----------|
| `bpm-patients` | รายชื่อคนไข้ทั้งหมด |
| `bpm-active-pid` | ID คนไข้ที่เลือกอยู่ |
| `bpm-rec-{id}` | ข้อมูลความดันของคนไข้แต่ละคน |
| `bpm-unlocked` | สถานะ Full Version |
| `bpm-trial-token` | Trial HMAC token |
| `bpm-device-id` | Device fingerprint |
| `bpm-admin-cfg` | ข้อมูลราคา/ธนาคาร/QR |
| `bpm-lang` | ภาษา (TH/EN) |
| `bpm-fontscale` | ขนาดตัวอักษร |

---

## 📦 Backup Format

### Single patient (backup ทีละคน)
```json
{
  "version": "v1.0.0",
  "format": "single",
  "exportedAt": "...",
  "patient": { "id": "...", "name": "...", "phone": "...", "notes": "..." },
  "records": [{ "date": "...", "morningSys": "120", ... }]
}
```

### All patients (backup ทุกคน)
```json
{
  "version": "v1.0.0",
  "format": "multi",
  "exportedAt": "...",
  "patients": [...],
  "records": {
    "patient-id-1": [...],
    "patient-id-2": [...]
  }
}
```

---

## 🛠 Admin Panel
- แตะ version ที่ header **5 ครั้ง** → ใส่ ADMIN_PASS
- ตั้งราคา, ธนาคาร, เลขบัญชี, QR URL, เบอร์ติดต่อ

---

## ⚠️ ความแตกต่างจากแอปเดิม (BPM-Tracker)

| BPM-Tracker (เดิม) | BP-Multi (ใหม่) |
|--------------------|-----------------|
| คนไข้คนเดียว | หลายคนไข้ |
| Sync Google Sheets | **ไม่มี** (local-only) |
| LINE notify (GAS) | LINE Messaging API โดยตรง |
| Storage key: `bp-*` | Storage key: `bpm-*` |
| ตาม GitHub: OadyTT/bpm-tracker | GitHub ใหม่แยกต่างหาก |

---

*Built with React + Vercel Serverless Functions*
