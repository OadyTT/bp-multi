import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════
//  BP-MULTI  v1.0.0  —  Multi-patient · Local-only
//  ข้อมูลเก็บในเครื่องเท่านั้น ไม่อัปโหลด server
// ═══════════════════════════════════════════════════
const APP_VERSION = "v1.0.0";
const BUILD_DATE  = "23 เม.ย. 2568";
const TRIAL_DAYS  = 60;
const ADMIN_LINE  = "Oady"; // เปลี่ยนได้ใน Admin Panel

// ── Storage keys (คนละชุดกับแอปเดิม) ─────────────
const KEY_PATIENTS  = "bpm-patients";       // [{id,name,phone,notes}]
const KEY_ACTIVE    = "bpm-active-pid";     // patient id ที่เลือกอยู่
const KEY_UNLOCKED  = "bpm-unlocked";
const KEY_DEVICE    = "bpm-device-id";
const KEY_TRIAL_TOK = "bpm-trial-token";
const KEY_ADMIN     = "bpm-admin-cfg";
const KEY_LANG      = "bpm-lang";
const KEY_FONTSCALE = "bpm-fontscale";
const recKey        = (pid) => `bpm-rec-${pid}`; // records per patient

// ── Helpers ───────────────────────────────────────
const lsGet = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const lsSet = (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const lsRaw = (k)     => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const todayISO = () => new Date().toISOString().split("T")[0];
const toThai   = (iso, lang = "TH") => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (lang === "EN") return `${d}/${m}/${y}`;
  const M = ["","ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  return `${parseInt(d)} ${M[parseInt(m)]} ${parseInt(y) + 543}`;
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ── Device ID ─────────────────────────────────────
const getDeviceId = () => {
  let id = lsRaw(KEY_DEVICE);
  if (!id) { id = "dev-" + uid(); localStorage.setItem(KEY_DEVICE, id); }
  return id;
};

// ── i18n ──────────────────────────────────────────
const T = {
  TH: {
    appName:"BP Multi", appSub:"บันทึกความดัน — หลายคนไข้",
    patients:"คนไข้", addPatient:"+ เพิ่มคนไข้", editPatient:"แก้ไขคนไข้",
    noPatients:"ยังไม่มีคนไข้", addFirst:"กด '+ เพิ่มคนไข้' เพื่อเริ่มต้น",
    selectFirst:"กรุณาเลือกคนไข้ก่อน",
    switchPatient:"เปลี่ยนคนไข้",
    name:"ชื่อ-นามสกุล", phone:"เบอร์โทร", notes:"หมายเหตุ / โรคประจำตัว",
    save:"บันทึก", cancel:"ยกเลิก", delete:"ลบ", close:"ปิด", edit:"แก้ไข", confirm:"ยืนยัน",
    deletePatientQ:"ลบคนไข้นี้?", deletePatientWarn:"ข้อมูลความดันทั้งหมดของคนไข้นี้จะหายถาวร",
    deleteRecordQ:"ลบรายการนี้?",
    record:"บันทึก", history:"ประวัติ", report:"รายงาน", settings:"ตั้งค่า",
    morning:"เช้า", evening:"เย็น / กลางคืน",
    date:"วันที่", time:"เวลา", upper:"ตัวบน", lower:"ตัวล่าง", pulse:"ชีพจร",
    saveRecord:"💾 บันทึกความดัน", saving:"⏳ กำลังบันทึก...",
    noData:"ยังไม่มีข้อมูล", startRecord:"เริ่มบันทึกความดันได้เลย",
    existingData:"มีข้อมูลวันนี้แล้ว — แก้ไขได้เลย",
    newDay:"วันใหม่ — กรอกเช้า เย็น หรือทั้งคู่",
    graph:"📈 กราฟ 14 วัน", advice:"🩺 คำแนะนำสุขภาพ",
    normal:"ปกติ", elevated:"สูงเล็กน้อย", high1:"สูงระดับ 1", high2:"สูงระดับ 2",
    printA4:"🖨️ พิมพ์ / PDF (A4)", saveJPG:"📸 บันทึกภาพ JPG",
    backupDevice:"📥 Backup ไฟล์ (.json)", backupAll:"📦 Backup ทุกคนไข้",
    restoreFile:"📤 Restore จากไฟล์", restoreOk:"นำเข้าข้อมูลสำเร็จ",
    patientInfo:"ข้อมูลคนไข้", saveInfo:"บันทึกข้อมูล",
    fontSize:"ขนาดตัวอักษร", language:"ภาษา",
    small:"เล็ก", medium:"กลาง", large:"ใหญ่", xlarge:"ใหญ่มาก",
    addToHome:"เพิ่มแอปลงหน้าจอ", addedToHome:"✅ แอปอยู่บนหน้าจอแล้ว",
    latest:"บันทึกล่าสุด", editMorning:"+ เพิ่มข้อมูลเช้า", editEvening:"+ เพิ่มข้อมูลเย็น",
    trial:"ทดลองใช้", daysLeft:"วันที่เหลือ", fullVer:"Full Version",
    upgrade:"💎 ดูรายละเอียด Full Version",
    unlockFull:"🔓 ปลดล็อค Full Version", enterCode:"ใส่รหัสปลดล็อค",
    notifyPay:"📲 แจ้งชำระเงิน", notifyDone:"✅ ส่งแจ้งเจ้าหน้าที่แล้ว",
    yourPhone:"เบอร์มือถือของคุณ", yourLineId:"LINE ID ของคุณ",
    version:"เวอร์ชัน", updatedAt:"อัปเดต",
    deleteAll:"🗑️ ลบข้อมูลความดันของคนไข้นี้ทั้งหมด",
    advanced:"▼ ตัวเลือกขั้นสูง", hideAdvanced:"▲ ซ่อน",
    ref:"อ้างอิง: WHO, AHA, ESC Guidelines 2023",
    records:"รายการ",
    storageNote:"ข้อมูลเก็บในเครื่องนี้เท่านั้น — ไม่อัปโหลดขึ้น server",
  },
  EN: {
    appName:"BP Multi", appSub:"Blood Pressure — Multi Patient",
    patients:"Patients", addPatient:"+ Add Patient", editPatient:"Edit Patient",
    noPatients:"No patients yet", addFirst:"Tap '+ Add Patient' to get started",
    selectFirst:"Please select a patient first",
    switchPatient:"Switch Patient",
    name:"Full Name", phone:"Phone", notes:"Notes / Medical History",
    save:"Save", cancel:"Cancel", delete:"Delete", close:"Close", edit:"Edit", confirm:"Confirm",
    deletePatientQ:"Delete this patient?", deletePatientWarn:"All BP records for this patient will be permanently deleted.",
    deleteRecordQ:"Delete this record?",
    record:"Record", history:"History", report:"Report", settings:"Settings",
    morning:"Morning", evening:"Evening / Night",
    date:"Date", time:"Time", upper:"Systolic", lower:"Diastolic", pulse:"Pulse",
    saveRecord:"💾 Save Blood Pressure", saving:"⏳ Saving...",
    noData:"No records yet", startRecord:"Start recording blood pressure",
    existingData:"Data exists for this date — edit below",
    newDay:"New day — fill morning, evening, or both",
    graph:"📈 14-Day Graph", advice:"🩺 Health Advice",
    normal:"Normal", elevated:"Elevated", high1:"High Stage 1", high2:"High Stage 2",
    printA4:"🖨️ Print / PDF (A4)", saveJPG:"📸 Save JPG Image",
    backupDevice:"📥 Backup File (.json)", backupAll:"📦 Backup All Patients",
    restoreFile:"📤 Restore from File", restoreOk:"Import successful",
    patientInfo:"Patient Info", saveInfo:"Save Info",
    fontSize:"Font Size", language:"Language",
    small:"Small", medium:"Medium", large:"Large", xlarge:"X-Large",
    addToHome:"Add App to Home Screen", addedToHome:"✅ App already on Home Screen",
    latest:"Latest Record", editMorning:"+ Add Morning", editEvening:"+ Add Evening",
    trial:"Trial", daysLeft:"Days Left", fullVer:"Full Version",
    upgrade:"💎 View Full Version Details",
    unlockFull:"🔓 Unlock Full Version", enterCode:"Enter unlock code",
    notifyPay:"📲 Notify Payment", notifyDone:"✅ Staff notified",
    yourPhone:"Your phone number", yourLineId:"Your LINE ID",
    version:"Version", updatedAt:"Updated",
    deleteAll:"🗑️ Delete All Records (This Patient)",
    advanced:"▼ Advanced Options", hideAdvanced:"▲ Hide",
    ref:"Source: WHO, AHA, ESC Guidelines 2023",
    records:"records",
    storageNote:"Data is stored on this device only — never uploaded to a server",
  },
};

// ── SVG Icons ─────────────────────────────────────
const Ic = {
  Home:     s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  Plus:     s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  List:     s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Camera:   s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Gear:     s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Heart:    s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  Sun:      s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon:     s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  Users:    s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  User:     s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Edit:     s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:    s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  Check:    s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>,
  X:        s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Download: s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="8,17 12,21 16,17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></svg>,
  Upload:   s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  Print:    s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  Chart:    s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
  Shield:   s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Lock:     s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  Unlock:   s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>,
  Gem:      s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6,3 18,3 22,9 12,22 2,9"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="3" x2="12" y2="22"/><line x1="6" y1="3" x2="2" y2="9"/><line x1="18" y1="3" x2="22" y2="9"/></svg>,
  Hourglass:s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 00-.586-1.414L12 12m5-10v4.172a2 2 0 01-.586 1.414L12 12M7 22v-4.172a2 2 0 01.586-1.414L12 12M7 2v4.172a2 2 0 00.586 1.414L12 12"/></svg>,
  Phone:    s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.69a16 16 0 006.29 6.29l1.06-1.06a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  Tag:      s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  Globe:    s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  Text:     s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="4,7 4,4 20,4 20,7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  Warn:     s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  QR:       s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><line x1="21" y1="14" x2="21" y2="14"/><line x1="21" y1="17" x2="21" y2="21"/><line x1="17" y1="21" x2="21" y2="21"/></svg>,
  Mobile:   s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  Star:     s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  Info:     s => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

// ── BP Status ─────────────────────────────────────
const BP_LEVELS = ["ปกติ","สูงเล็กน้อย","สูงระดับ 1","สูงระดับ 2"];
const bpStatus = (sys, dia) => {
  const s = parseInt(sys), d = parseInt(dia);
  if (!s || !d) return null;
  if (s < 120 && d < 80) return { label:"ปกติ",         labelEN:"Normal",    bg:"#d1fae5", fg:"#065f46", bar:"#10b981" };
  if (s < 130 && d < 80) return { label:"สูงเล็กน้อย",  labelEN:"Elevated",  bg:"#fef9c3", fg:"#854d0e", bar:"#eab308" };
  if (s < 140 || d < 90) return { label:"สูงระดับ 1",   labelEN:"High St.1", bg:"#ffedd5", fg:"#9a3412", bar:"#f97316" };
  return                        { label:"สูงระดับ 2",   labelEN:"High St.2", bg:"#fee2e2", fg:"#991b1b", bar:"#ef4444" };
};
const rank = (st) => st ? BP_LEVELS.indexOf(st.label) : -1;
const bpLab = (st, lang) => lang === "EN" ? st?.labelEN : st?.label;

// ── Font scale ────────────────────────────────────
const FS = { small: 0.85, medium: 1, large: 1.18, xlarge: 1.42 };

// ── Server calls (trial + unlock only — no data sync) ─
const verifyCode = async (type, code) => {
  try {
    const r = await fetch("/api/verify", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ type, code }) });
    const d = await r.json();
    return d.ok === true;
  } catch { return false; }
};
const trialRegister = async (deviceId) => {
  try {
    const r = await fetch("/api/verify", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ type:"trial_register", deviceId }) });
    return await r.json();
  } catch { return null; }
};
const trialCheck = async (deviceId, token) => {
  try {
    const r = await fetch("/api/verify", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ type:"trial_check", deviceId, token }) });
    return await r.json();
  } catch { return null; }
};

// ── Input Component ───────────────────────────────
const Inp = ({ label, value, onChange, type="text", placeholder, unit, readOnly, scale=1, rows }) => {
  const s = scale;
  const inputStyle = {
    width:"100%", padding:`${Math.round(13*s)}px ${unit?Math.round(52*s):Math.round(14*s)}px ${Math.round(13*s)}px ${Math.round(14*s)}px`,
    borderRadius:10, border:"1.5px solid #d1d5db", fontSize:Math.round(18*s),
    background: readOnly?"#f9fafb":"white", outline:"none",
    fontFamily:"Sarabun,sans-serif", color:"#111827", boxSizing:"border-box", fontWeight:600,
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:Math.round(5*s) }}>
      {label && <label style={{ fontSize:Math.round(15*s), fontWeight:700, color:"#374151" }}>{label}</label>}
      <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
        {rows
          ? <textarea rows={rows} value={value||""} onChange={e=>onChange&&onChange(e.target.value)} placeholder={placeholder}
              style={{...inputStyle, resize:"vertical", paddingRight:Math.round(14*s)}}
              onFocus={e=>e.target.style.borderColor="#059669"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
          : <input type={type} value={value||""} readOnly={readOnly}
              onChange={e=>onChange&&onChange(e.target.value)} placeholder={placeholder}
              style={inputStyle}
              onFocus={e=>{ if(!readOnly) e.target.style.borderColor="#059669"; }}
              onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
        }
        {unit && <span style={{ position:"absolute", right:12, fontSize:Math.round(13*s), color:"#9ca3af", fontWeight:700, pointerEvents:"none" }}>{unit}</span>}
      </div>
    </div>
  );
};

// ── BP Graph ──────────────────────────────────────
const BPGraph = ({ records, lang }) => {
  const last14 = records.slice(-14);
  if (last14.length < 2) return (
    <div style={{ textAlign:"center", padding:20, color:"#94a3b8", fontSize:14 }}>
      {lang==="EN" ? "Need at least 2 records" : "ต้องมีข้อมูลอย่างน้อย 2 รายการ"}
    </div>
  );
  const W=320,H=160,PL=36,PR=10,PT=10,PB=30, gW=W-PL-PR, gH=H-PT-PB;
  const sysV = last14.map(r => r.morningSys?+r.morningSys:(r.eveningSys?+r.eveningSys:null));
  const diaV = last14.map(r => r.morningDia?+r.morningDia:(r.eveningDia?+r.eveningDia:null));
  const all = [...sysV,...diaV].filter(Boolean);
  if (!all.length) return null;
  const minV=Math.max(50,Math.min(...all)-10), maxV=Math.min(200,Math.max(...all)+10);
  const xP = i => PL+(i/(last14.length-1))*gW;
  const yP = v => PT+(1-(v-minV)/(maxV-minV))*gH;
  const pathStr = vals => vals.map((v,i)=>v?`${i===0||!vals[i-1]?"M":"L"}${xP(i)},${yP(v)}`:"").filter(Boolean).join(" ");
  return (
    <div style={{ overflowX:"auto" }}>
      <svg width={W} height={H} style={{ display:"block", margin:"0 auto" }}>
        {[120,130,140].filter(g=>g>=minV&&g<=maxV).map(g=>(
          <g key={g}>
            <line x1={PL} y1={yP(g)} x2={W-PR} y2={yP(g)} stroke="#fca5a5" strokeWidth="1" strokeDasharray="4"/>
            <text x={PL-2} y={yP(g)+4} fontSize="9" fill="#ef4444" textAnchor="end">{g}</text>
          </g>
        ))}
        <line x1={PL} y1={PT} x2={PL} y2={H-PB} stroke="#e2e8f0" strokeWidth="1"/>
        <line x1={PL} y1={H-PB} x2={W-PR} y2={H-PB} stroke="#e2e8f0" strokeWidth="1"/>
        {[minV,Math.round((minV+maxV)/2),maxV].map(v=>(
          <text key={v} x={PL-4} y={yP(v)+4} fontSize="9" fill="#94a3b8" textAnchor="end">{v}</text>
        ))}
        {last14.map((_,i)=>i%3===0&&(
          <text key={i} x={xP(i)} y={H-4} fontSize="8" fill="#94a3b8" textAnchor="middle">{last14[i].date.slice(8)}</text>
        ))}
        <path d={pathStr(sysV)} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d={pathStr(diaV)} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinejoin="round"/>
        {sysV.map((v,i)=>v&&<circle key={i} cx={xP(i)} cy={yP(v)} r="3.5" fill="#059669"/>)}
        {diaV.map((v,i)=>v&&<circle key={i} cx={xP(i)} cy={yP(v)} r="3" fill="#0ea5e9"/>)}
      </svg>
      <div style={{ display:"flex", justifyContent:"center", gap:16, marginTop:6, fontSize:13 }}>
        <span><span style={{ display:"inline-block", width:14, height:3, background:"#059669", borderRadius:2, verticalAlign:"middle", marginRight:4 }}/>{lang==="EN"?"Systolic":"ตัวบน"}</span>
        <span><span style={{ display:"inline-block", width:14, height:3, background:"#0ea5e9", borderRadius:2, verticalAlign:"middle", marginRight:4 }}/>{lang==="EN"?"Diastolic":"ตัวล่าง"}</span>
      </div>
    </div>
  );
};

// ── Health Recs ───────────────────────────────────
const getRec = (records) => {
  const last7 = records.slice(-7);
  if (!last7.length) return null;
  const vals = last7.flatMap(r=>[
    r.morningSys ? {s:+r.morningSys,d:+r.morningDia} : null,
    r.eveningSys ? {s:+r.eveningSys,d:+r.eveningDia} : null,
  ]).filter(Boolean);
  if (!vals.length) return null;
  const avgS = Math.round(vals.reduce((a,v)=>a+v.s,0)/vals.length);
  const avgD = Math.round(vals.reduce((a,v)=>a+v.d,0)/vals.length);
  const st = bpStatus(avgS, avgD);
  const tips = {
    "ปกติ":        { TH:["✅ ความดันอยู่ในเกณฑ์ดี ดูแลต่อไป","🥗 รับประทานผักผลไม้ครบ 5 หมู่","🏃 ออกกำลังกาย 30 นาที/วัน"], EN:["✅ BP is normal — keep it up","🥗 Eat 5 servings of fruits & vegetables","🏃 Exercise 30 min/day"] },
    "สูงเล็กน้อย": { TH:["⚠️ ลดเกลือและโซเดียมในอาหาร","🚶 เดิน 30–45 นาที/วัน","😴 นอนหลับ 7–8 ชั่วโมง"], EN:["⚠️ Reduce salt & sodium","🚶 Walk 30–45 min/day","😴 Sleep 7–8 hours"] },
    "สูงระดับ 1":  { TH:["🏥 ควรพบแพทย์เพื่อประเมิน","🚫 งดอาหารเค็มและแอลกอฮอล์","💊 รับประทานยาตามแพทย์สั่ง"], EN:["🏥 See a doctor for evaluation","🚫 Avoid salty food & alcohol","💊 Take medication as prescribed"] },
    "สูงระดับ 2":  { TH:["🚨 ความดันสูงมาก พบแพทย์โดยด่วน","🚫 ห้ามออกกำลังหนัก","📞 เจ็บหน้าอก/ปวดศีรษะ รีบไป ER"], EN:["🚨 Very high — see doctor urgently","🚫 Avoid strenuous exercise","📞 Chest pain/headache? Go to ER"] },
  };
  return { avgS, avgD, status:st, tips:(st?tips[st.label]:null)||{TH:[],EN:[]} };
};

// ── Paywall Modal ─────────────────────────────────
const Paywall = ({ adminCfg, onUnlock, onBack, lang, scale }) => {
  const t = T[lang];
  const fs = FS[scale] || 1;
  const [code,setCode]       = useState("");
  const [err,setErr]         = useState(false);
  const [loading,setLoading] = useState(false);
  const [phone,setPhone]     = useState("");
  const [lineId,setLineId]   = useState("");
  const [notified,setNotified] = useState(false);
  const [nLoading,setNLoading] = useState(false);

  const tryUnlock = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const ok = await verifyCode("unlock", code.trim());
    setLoading(false);
    if (ok) onUnlock();
    else { setErr(true); setTimeout(()=>setErr(false), 2500); }
  };
  const doNotify = async () => {
    if (!phone.trim()) return;
    setNLoading(true);
    // ส่งข้อมูลแจ้ง admin ผ่าน API route
    try {
      await fetch("/api/notify", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ phone, lineId, adminLine: ADMIN_LINE, timestamp: new Date().toLocaleString("th-TH") }) });
    } catch {}
    setNLoading(false);
    setNotified(true);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(6,95,70,0.96)", zIndex:900, display:"flex", alignItems:"center", justifyContent:"center", padding:16, fontFamily:"Sarabun,sans-serif", overflowY:"auto" }}>
      <div style={{ background:"white", borderRadius:24, padding:24, width:"100%", maxWidth:400, margin:"auto" }}>
        <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"#64748b", fontSize:Math.round(15*fs), cursor:"pointer", fontFamily:"Sarabun,sans-serif", marginBottom:14, padding:0 }}>
          ← {lang==="EN"?"Back":"ย้อนกลับ"}
        </button>
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <div style={{ color:"#059669", marginBottom:6 }}>{Ic.Lock(Math.round(44*fs))}</div>
          <div style={{ fontSize:Math.round(22*fs), fontWeight:800, color:"#065f46" }}>{lang==="EN"?"Trial Ended":"หมดระยะทดลองใช้"}</div>
        </div>

        {/* Payment info */}
        {(adminCfg.price||adminCfg.bankName||adminCfg.qrUrl) && (
          <div style={{ background:"#f0fdf4", borderRadius:14, padding:"12px 16px", marginBottom:14, fontSize:Math.round(14*fs), lineHeight:2 }}>
            {adminCfg.price     && <div>💰 {lang==="EN"?"Price":"ราคา"}: <strong>{adminCfg.price}</strong></div>}
            {adminCfg.bankName  && <div>🏦 {adminCfg.bankName}</div>}
            {adminCfg.accountNo && <div>📋 {adminCfg.accountNo}</div>}
            {adminCfg.accountName&&<div>👤 {adminCfg.accountName}</div>}
            {adminCfg.contactPhone&&<div>{Ic.Phone(14)} {adminCfg.contactPhone}</div>}
          </div>
        )}
        {adminCfg.qrUrl && (
          <div style={{ textAlign:"center", marginBottom:14 }}>
            <img src={adminCfg.qrUrl} alt="QR" style={{ width:Math.round(180*fs), height:Math.round(180*fs), borderRadius:12, border:"2px solid #a7f3d0" }} onError={e=>e.target.style.display="none"}/>
          </div>
        )}

        {/* Notify form */}
        {!notified ? (
          <div style={{ background:"#fefce8", borderRadius:12, padding:14, marginBottom:14 }}>
            <div style={{ fontSize:Math.round(14*fs), fontWeight:700, color:"#92400e", marginBottom:8 }}>{t.notifyPay}</div>
            <Inp value={phone} onChange={setPhone} placeholder={t.yourPhone} scale={fs}/>
            <div style={{ marginTop:8 }}>
              <Inp value={lineId} onChange={setLineId} placeholder={t.yourLineId} scale={fs}/>
            </div>
            <button onClick={doNotify} disabled={nLoading||!phone}
              style={{ marginTop:10, width:"100%", padding:13, background: nLoading?"#94a3b8":"linear-gradient(135deg,#d97706,#b45309)", color:"white", border:"none", borderRadius:10, fontSize:Math.round(16*fs), fontWeight:800, fontFamily:"Sarabun,sans-serif", cursor:"pointer" }}>
              {nLoading ? "⏳..." : t.notifyPay}
            </button>
          </div>
        ) : (
          <div style={{ background:"#d1fae5", borderRadius:12, padding:14, marginBottom:14, textAlign:"center" }}>
            <div style={{ color:"#065f46" }}>{Ic.Check(Math.round(22*fs))}</div>
            <div style={{ fontSize:Math.round(15*fs), fontWeight:700, color:"#065f46" }}>{t.notifyDone}</div>
            <div style={{ fontSize:Math.round(13*fs), color:"#047857" }}>Line: {ADMIN_LINE}</div>
          </div>
        )}

        {/* Unlock code */}
        <Inp value={code} onChange={setCode} placeholder={t.enterCode} scale={fs}/>
        {err && <div style={{ color:"#ef4444", fontSize:Math.round(13*fs), marginTop:4, textAlign:"center" }}>❌ {lang==="EN"?"Invalid code":"รหัสไม่ถูกต้อง"}</div>}
        <button onClick={tryUnlock} disabled={loading}
          style={{ marginTop:12, width:"100%", padding:16, background: loading?"#94a3b8":"linear-gradient(135deg,#059669,#047857)", color:"white", border:"none", borderRadius:12, fontSize:Math.round(19*fs), fontWeight:800, fontFamily:"Sarabun,sans-serif", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {loading ? "⏳..." : <>{Ic.Unlock(20)} {t.unlockFull}</>}
        </button>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════════
export default function App() {
  // ── State ──────────────────────────────────────
  const [tab,setTab]             = useState("patients");
  const [patients,setPatients]   = useState([]);
  const [activePid,setActivePid] = useState(null);  // active patient id
  const [records,setRecords]     = useState([]);
  const [lang,setLang]           = useState(()=>lsRaw(KEY_LANG)||"TH");
  const [fontScale,setFontScale] = useState(()=>lsRaw(KEY_FONTSCALE)||"medium");
  const [loaded,setLoaded]       = useState(false);

  // Trial/Unlock
  const [isUnlocked,setIsUnlocked]   = useState(false);
  const [trialLeft,setTrialLeft]     = useState(TRIAL_DAYS);
  const [daysUsed,setDaysUsed]       = useState(0);
  const [trialLoading,setTrialLoading] = useState(true);
  const [showPaywall,setShowPaywall] = useState(false);
  const [showUpgrade,setShowUpgrade] = useState(false);
  const [adminCfg,setAdminCfg]       = useState({ price:"", bankName:"", accountNo:"", accountName:"", qrUrl:"", contactPhone:"", adminPass:"" });
  const [adminTap,setAdminTap]       = useState(0);
  const [showAdmin,setShowAdmin]     = useState(false);
  const [adminAuth,setAdminAuth]     = useState(false);
  const [adminPassInput,setAdminPassInput] = useState("");
  const [adminLoading,setAdminLoading]     = useState(false);

  // UI
  const [toast,setToast]               = useState(null);
  const [saving,setSaving]             = useState(false);
  const [capturing,setCapturing]       = useState(false);
  const [deleteConfirm,setDeleteConfirm] = useState(null); // {type:"patient"|"record", data}
  const [showDeleteZone,setShowDeleteZone] = useState(false);
  const [editRecord,setEditRecord]     = useState(null);
  const [patientModal,setPatientModal] = useState(null);  // null|"add"|{...patient}
  const [patientForm,setPatientForm]   = useState({name:"",phone:"",notes:""});
  const [deferredPrompt,setDeferredPrompt] = useState(null);
  const [isInstalled,setIsInstalled]   = useState(false);
  const reportRef = useRef(null);

  const t  = T[lang];
  const fs = FS[fontScale] || 1;
  const emptyForm = { date:todayISO(), morningTime:"", morningSys:"", morningDia:"", morningPulse:"", eveningTime:"", eveningSys:"", eveningDia:"", eveningPulse:"" };
  const [form,setForm] = useState(emptyForm);

  // ── Init ───────────────────────────────────────
  useEffect(() => {
    const pts = lsGet(KEY_PATIENTS, []);
    setPatients(pts);
    const storedPid = lsRaw(KEY_ACTIVE);
    if (storedPid && pts.find(p=>p.id===storedPid)) {
      setActivePid(storedPid);
      setRecords(lsGet(recKey(storedPid), []));
    }
    setAdminCfg(lsGet(KEY_ADMIN, { price:"", bankName:"", accountNo:"", accountName:"", qrUrl:"", contactPhone:"", adminPass:"" }));

    const unlocked = lsGet(KEY_UNLOCKED, false);
    setIsUnlocked(unlocked);
    if (!unlocked) {
      const deviceId = getDeviceId();
      const token = lsRaw(KEY_TRIAL_TOK);
      (async () => {
        setTrialLoading(true);
        let result = null;
        if (token) {
          result = await trialCheck(deviceId, token);
          if (result?.tampered) result = { ok:false, expired:true, daysLeft:0 };
        }
        if (!result?.ok) {
          const reg = await trialRegister(deviceId);
          if (reg?.ok) {
            localStorage.setItem(KEY_TRIAL_TOK, reg.token);
            result = { ok:true, daysLeft:TRIAL_DAYS, daysUsed:0, expired:false };
          } else {
            // Fallback: localStorage-based trial
            let inst = localStorage.getItem("bpm-install-date");
            if (!inst) { inst = new Date().toISOString(); localStorage.setItem("bpm-install-date", inst); }
            const used = Math.floor((Date.now()-new Date(inst))/86400000);
            result = { ok:true, daysLeft:Math.max(0,TRIAL_DAYS-used), daysUsed:used, expired:used>=TRIAL_DAYS };
          }
        }
        const left = result.daysLeft ?? TRIAL_DAYS;
        const used = result.daysUsed ?? (TRIAL_DAYS - left);
        setTrialLeft(left); setDaysUsed(used);
        if (result.expired || left === 0) setShowPaywall(true);
        setTrialLoading(false);
      })();
    } else { setTrialLoading(false); }

    if (!window._h2cLoaded) {
      window._h2cLoaded = true;
      const sc = document.createElement("script");
      sc.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      document.head.appendChild(sc);
    }
    if (window.matchMedia("(display-mode:standalone)").matches || window.navigator.standalone) setIsInstalled(true);
    const hbi = e => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", hbi);
    window.addEventListener("appinstalled", ()=>{ setIsInstalled(true); setDeferredPrompt(null); });
    setLoaded(true);
    return () => window.removeEventListener("beforeinstallprompt", hbi);
  };

  // ── Helpers ────────────────────────────────────
  const toast$ = (msg, type="ok", dur=3200) => { setToast({msg,type}); setTimeout(()=>setToast(null),dur); };
  const isPremium = isUnlocked || (trialLeft > 0 && !trialLoading);
  const activePatient = patients.find(p=>p.id===activePid) || null;
  const changeLang = l => { setLang(l); localStorage.setItem(KEY_LANG,l); };
  const changeFontScale = f => { setFontScale(f); localStorage.setItem(KEY_FONTSCALE,f); };
  const doUnlock = () => { lsSet(KEY_UNLOCKED,true); setIsUnlocked(true); setShowPaywall(false); toast$("🎉 ปลดล็อคสำเร็จ! Full Version"); };

  // ── Patient CRUD ───────────────────────────────
  const openAddPatient = () => { setPatientForm({name:"",phone:"",notes:""}); setPatientModal("add"); };
  const openEditPatient = (p) => { setPatientForm({name:p.name,phone:p.phone||"",notes:p.notes||""}); setPatientModal(p); };
  const savePatient = () => {
    if (!patientForm.name.trim()) return;
    let updated;
    if (patientModal === "add") {
      const np = { id: uid(), name:patientForm.name.trim(), phone:patientForm.phone.trim(), notes:patientForm.notes.trim(), createdAt:new Date().toISOString() };
      updated = [...patients, np];
      setPatients(updated); lsSet(KEY_PATIENTS, updated);
      // Auto-select new patient
      setActivePid(np.id); localStorage.setItem(KEY_ACTIVE, np.id);
      setRecords([]); setForm(emptyForm); setEditRecord(null);
      setTab("record");
      toast$(lang==="EN"?"Patient added — start recording":"เพิ่มคนไข้แล้ว — เริ่มบันทึกได้เลย");
    } else {
      updated = patients.map(p => p.id===patientModal.id ? {...p, name:patientForm.name.trim(), phone:patientForm.phone.trim(), notes:patientForm.notes.trim()} : p);
      setPatients(updated); lsSet(KEY_PATIENTS, updated);
      toast$(lang==="EN"?"Saved":"บันทึกแล้ว");
    }
    setPatientModal(null);
  };
  const deletePatient = (pid) => {
    try { localStorage.removeItem(recKey(pid)); } catch {}
    const updated = patients.filter(p=>p.id!==pid);
    setPatients(updated); lsSet(KEY_PATIENTS, updated);
    if (activePid===pid) {
      setActivePid(null); localStorage.removeItem(KEY_ACTIVE);
      setRecords([]); setTab("patients");
    }
    setDeleteConfirm(null);
    toast$(lang==="EN"?"Patient deleted":"ลบแล้ว");
  };
  const selectPatient = (pid) => {
    setActivePid(pid); localStorage.setItem(KEY_ACTIVE, pid);
    setRecords(lsGet(recKey(pid),[]));
    setForm({ date:todayISO(), morningTime:"", morningSys:"", morningDia:"", morningPulse:"", eveningTime:"", eveningSys:"", eveningDia:"", eveningPulse:"" }); setEditRecord(null); setTab("record");
  };

  // ── Form ───────────────────────────────────────
  const changeDate = (newDate) => {
    const ex = records.find(r=>r.date===newDate);
    if (ex) setForm({...ex});
    else setForm({ date:newDate, morningTime:"", morningSys:"", morningDia:"", morningPulse:"", eveningTime:"", eveningSys:"", eveningDia:"", eveningPulse:"" });
  };
  const setF = k => v => { if (k==="date") { changeDate(v); return; } setForm(f=>({...f,[k]:v})); };

  // ── Submit record ──────────────────────────────
  const submit = async () => {
    if (!activePid) { toast$(t.selectFirst,"warn"); return; }
    if (!isPremium) { setShowPaywall(true); return; }
    if (!form.morningSys && !form.morningDia && !form.eveningSys && !form.eveningDia) {
      toast$(lang==="EN"?"Enter at least one reading":"กรอกค่าอย่างน้อย 1 ช่วง","err"); return;
    }
    setSaving(true);
    const idx = records.findIndex(r=>r.date===form.date);
    const ex = idx>=0 ? records[idx] : null;
    const entry = {
      date:form.date, id:ex?ex.id:Date.now(),
      morningTime:  form.morningSys ? form.morningTime  : (ex?.morningTime||""),
      morningSys:   form.morningSys || ex?.morningSys || "",
      morningDia:   form.morningSys ? form.morningDia   : (ex?.morningDia||""),
      morningPulse: form.morningSys ? form.morningPulse : (ex?.morningPulse||""),
      eveningTime:  form.eveningSys ? form.eveningTime  : (ex?.eveningTime||""),
      eveningSys:   form.eveningSys || ex?.eveningSys || "",
      eveningDia:   form.eveningSys ? form.eveningDia   : (ex?.eveningDia||""),
      eveningPulse: form.eveningSys ? form.eveningPulse : (ex?.eveningPulse||""),
    };
    const next = idx>=0
      ? records.map((r,i)=>i===idx?entry:r)
      : [...records,entry].sort((a,b)=>a.date.localeCompare(b.date));
    setRecords(next); lsSet(recKey(activePid), next);
    toast$(ex ? (lang==="EN"?"✅ Updated":"✅ อัปเดตแล้ว") : (lang==="EN"?"✅ Saved":"✅ บันทึกแล้ว"));
    setForm(emptyForm); setEditRecord(null); setSaving(false); setTab("history");
  };

  const openEdit = r => { setEditRecord(r); setForm({...r}); setTab("record"); };
  const delRecord = id => {
    const next = records.filter(r=>r.id!==id);
    setRecords(next); lsSet(recKey(activePid), next);
    setDeleteConfirm(null); toast$(lang==="EN"?"Deleted":"ลบแล้ว");
  };

  // ── Backup / Restore ───────────────────────────
  const backupOne = async () => {
    if (!activePatient) return;
    const data = { version:APP_VERSION, format:"single", exportedAt:new Date().toISOString(), patient:activePatient, records };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const filename = `bp-${activePatient.name}_${todayISO()}.json`;
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], filename, {type:"application/json"});
        if (navigator.canShare({files:[file]})) { await navigator.share({files:[file], title:"BP Backup"}); toast$(t.backupDevice+" ✓"); return; }
      } catch(e) { if(e.name==="AbortError") return; }
    }
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),10000);
    toast$(lang==="EN"?"Backup saved":"Backup บันทึกแล้ว");
  };
  const backupAll = async () => {
    const allRecords = {};
    patients.forEach(p => { allRecords[p.id] = lsGet(recKey(p.id),[]); });
    const data = { version:APP_VERSION, format:"multi", exportedAt:new Date().toISOString(), patients, records:allRecords };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const filename = `bp-all-patients_${todayISO()}.json`;
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),10000);
    toast$(lang==="EN"?"All patients backed up":"Backup ทุกคนไข้แล้ว");
  };
  const importFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.format === "single" && d.patient && Array.isArray(d.records)) {
          // Single patient format
          const pid = d.patient.id || uid();
          const np  = { ...d.patient, id:pid };
          const updatedPts = patients.find(p=>p.id===pid) ? patients.map(p=>p.id===pid?np:p) : [...patients,np];
          setPatients(updatedPts); lsSet(KEY_PATIENTS, updatedPts);
          lsSet(recKey(pid), d.records);
          selectPatient(pid);
          toast$(`${t.restoreOk} — ${d.records.length} ${t.records}`);
        } else if (d.format === "multi" && d.patients && d.records) {
          // Multi patient format
          const existIds = new Set(patients.map(p=>p.id));
          const mergedPts = [...patients];
          d.patients.forEach(p => { if(!existIds.has(p.id)) mergedPts.push(p); });
          setPatients(mergedPts); lsSet(KEY_PATIENTS, mergedPts);
          Object.entries(d.records).forEach(([pid,recs]) => lsSet(recKey(pid),recs));
          toast$(`${t.restoreOk} — ${d.patients.length} ${lang==="EN"?"patients":"คนไข้"}`);
          setTab("patients");
        } else {
          toast$(lang==="EN"?"Unrecognized file format":"รูปแบบไฟล์ไม่ถูกต้อง","err");
        }
      } catch { toast$(lang==="EN"?"Cannot read file":"อ่านไฟล์ไม่ได้","err"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Print ──────────────────────────────────────
  const doPrint = () => {
    if (!records.length) { toast$(t.noData,"warn"); return; }
    const rows = records.map(r=>{
      const ms=bpStatus(r.morningSys,r.morningDia), es=bpStatus(r.eveningSys,r.eveningDia);
      const w=rank(ms)>=rank(es)?(ms||es):(es||ms);
      return `<tr><td style="text-align:left">${toThai(r.date,lang)}</td><td style="color:#92400e">${r.morningTime||"–"}</td><td style="font-weight:700;color:${ms?ms.fg:"#000"}">${r.morningSys||"–"}</td><td>${r.morningDia||"–"}</td><td>${r.morningPulse||"–"}</td><td style="color:#1d4ed8">${r.eveningTime||"–"}</td><td style="font-weight:700;color:${es?es.fg:"#000"}">${r.eveningSys||"–"}</td><td>${r.eveningDia||"–"}</td><td>${r.eveningPulse||"–"}</td><td style="background:${w?w.bg:"#fff"};color:${w?w.fg:"#000"};font-weight:700">${w?bpLab(w,lang):""}</td></tr>`;
    }).join("");
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet"/><style>*{font-family:'Sarabun',sans-serif;box-sizing:border-box}body{margin:0;padding:12mm 15mm}@page{size:A4 portrait;margin:12mm 15mm}h2{text-align:center;color:#059669}table{width:100%;border-collapse:collapse;font-size:10pt}th,td{border:1px solid #94a3b8;padding:5px;text-align:center}th{background:#059669;color:white}tr:nth-child(even)td{background:#f0fdf4}.meta{text-align:center;color:#94a3b8;font-size:9pt;margin-bottom:10px}.printbtn{display:block;margin:0 auto 14px;padding:10px 28px;background:#059669;color:white;border:none;border-radius:8px;font-size:14pt;cursor:pointer;font-family:'Sarabun',sans-serif}@media print{.printbtn{display:none}}</style></head><body><button class="printbtn" onclick="window.print()">${t.printA4}</button><h2>${lang==="EN"?"Blood Pressure Report":"รายงานความดันโลหิต"}</h2>${activePatient?`<div class="meta">👤 ${activePatient.name}${activePatient.phone?` · 📞 ${activePatient.phone}`:""}${activePatient.notes?` · ${activePatient.notes}`:""}</div>`:""}<div class="meta">${toThai(todayISO(),lang)} · ${records.length} ${t.records} · ${APP_VERSION}</div><table><thead><tr><th rowspan="2">${t.date}</th><th colspan="4" style="background:#92400e">${t.morning}</th><th colspan="4" style="background:#1d4ed8">${t.evening}</th><th rowspan="2">${lang==="EN"?"Status":"สถานะ"}</th></tr><tr><th style="background:#b45309">${t.time}</th><th style="background:#b45309">${t.upper}</th><th style="background:#b45309">${t.lower}</th><th style="background:#b45309">${t.pulse}</th><th style="background:#2563eb">${t.time}</th><th style="background:#2563eb">${t.upper}</th><th style="background:#2563eb">${t.lower}</th><th style="background:#2563eb">${t.pulse}</th></tr></thead><tbody>${rows}</tbody></table><p style="text-align:right;font-size:8pt;color:#94a3b8">${APP_VERSION} · Normal &lt;120/80 mmHg</p></body></html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.target="_blank"; a.rel="noopener"; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),60000);
    toast$(lang==="EN"?"Report opened — click Print":"เปิดรายงานแล้ว — กดพิมพ์","ok",4000);
  };

  // ── Save JPG ───────────────────────────────────
  const saveJPG = async () => {
    if (!reportRef.current) return;
    if (!window.html2canvas) { toast$(lang==="EN"?"Loading, try again":"กำลังโหลด ลองใหม่","warn"); return; }
    setCapturing(true);
    try {
      const canvas = await window.html2canvas(reportRef.current, { scale:2.5, useCORS:true, backgroundColor:"#ffffff" });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.93);
      if (navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `bp-${activePatient?.name||"record"}.jpg`, {type:"image/jpeg"});
        if (navigator.canShare({files:[file]})) { await navigator.share({files:[file]}); toast$("✅ Shared"); setCapturing(false); return; }
      }
      const a = document.createElement("a"); a.href=dataUrl; a.download=`bp-${activePatient?.name||"record"}_${todayISO()}.jpg`; a.click();
      toast$("✅ "+t.saveJPG);
    } catch { toast$(lang==="EN"?"Error, try again":"เกิดข้อผิดพลาด","err"); }
    setCapturing(false);
  };

  // ── PWA Install ────────────────────────────────
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const doInstall = async () => {
    if (isInstalled) { toast$("✅ "+t.addedToHome,"ok",3000); return; }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome==="accepted") { setIsInstalled(true); toast$("✅ "+t.addedToHome); }
      setDeferredPrompt(null);
    } else {
      toast$(isIOS ? "กด Share → Add to Home Screen" : "กด ⋮ → Add to Home screen","ok",6000);
    }
  };
  const handleVerTap = () => {
    const n = adminTap+1;
    if (n>=5) { setShowAdmin(true); setAdminTap(0); }
    else { setAdminTap(n); setTimeout(()=>setAdminTap(0),3000); }
  };

  const rec     = getRec(records);
  const mStatus = bpStatus(form.morningSys, form.morningDia);
  const eStatus = bpStatus(form.eveningSys, form.eveningDia);

  // ── Styles ─────────────────────────────────────
  const S = {
    app:      { fontFamily:"'Sarabun',sans-serif", background:"#f8fafc", minHeight:"100vh", maxWidth:520, margin:"0 auto", paddingBottom:90 },
    header:   { background:"linear-gradient(135deg,#065f46,#059669)", padding:`${Math.round(22*fs)}px 18px ${Math.round(18*fs)}px`, color:"white" },
    card:     { background:"white", borderRadius:16, padding:Math.round(20*fs), margin:"0 14px 14px", boxShadow:"0 2px 8px rgba(0,0,0,0.07)" },
    grid2:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:Math.round(12*fs) },
    btnMain:  { width:"100%", padding:`${Math.round(16*fs)}px`, background:"linear-gradient(135deg,#059669,#047857)", color:"white", border:"none", borderRadius:12, fontSize:Math.round(18*fs), fontWeight:800, fontFamily:"Sarabun,sans-serif", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 },
    btnGhost: { padding:`${Math.round(13*fs)}px ${Math.round(18*fs)}px`, borderRadius:11, border:"1.5px solid #059669", background:"white", color:"#059669", fontSize:Math.round(15*fs), fontWeight:700, fontFamily:"Sarabun,sans-serif", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 },
    tabBar:   { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:520, background:"white", borderTop:"1.5px solid #e5e7eb", display:"flex", zIndex:100 },
    tabItem:  a => ({ flex:1, padding:"10px 2px 8px", border:"none", background:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, color:a?"#059669":"#9ca3af", fontFamily:"Sarabun,sans-serif", fontSize:Math.round(11*fs), fontWeight:a?800:500 }),
    badge:    st => ({ display:"inline-block", padding:`${Math.round(3*fs)}px ${Math.round(9*fs)}px`, borderRadius:20, fontSize:Math.round(12*fs), fontWeight:800, background:st.bg, color:st.fg }),
    histCard: { background:"white", borderRadius:14, padding:Math.round(16*fs), margin:"0 14px 12px", boxShadow:"0 1px 5px rgba(0,0,0,0.07)", borderLeft:"4px solid" },
    secTitle: { fontSize:Math.round(18*fs), fontWeight:800, marginBottom:Math.round(14*fs), display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" },
  };

  if (!loaded || trialLoading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"Sarabun,sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ color:"#059669", marginBottom:10 }}>{Ic.Heart(Math.round(52*fs))}</div>
        <div style={{ color:"#64748b", fontSize:Math.round(18*fs) }}>{lang==="EN"?"Loading...":"กำลังโหลด..."}</div>
        {trialLoading && <div style={{ color:"#94a3b8", fontSize:Math.round(13*fs), marginTop:6 }}>{lang==="EN"?"Verifying trial...":"กำลังตรวจสอบสิทธิ์..."}</div>}
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`*{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}input[type=number]::-webkit-inner-spin-button{opacity:.4;}`}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", background:toast.type==="err"?"#ef4444":toast.type==="warn"?"#f59e0b":"#059669", color:"white", padding:`${Math.round(12*fs)}px ${Math.round(22*fs)}px`, borderRadius:30, fontSize:Math.round(15*fs), fontWeight:700, zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,0.2)", maxWidth:"92vw", textAlign:"center" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Paywall ── */}
      {showPaywall && <Paywall adminCfg={adminCfg} onUnlock={doUnlock} onBack={()=>setShowPaywall(false)} lang={lang} scale={fontScale}/>}

      {/* ── Upgrade Screen ── */}
      {showUpgrade && (
        <div style={{ position:"fixed", inset:0, zIndex:800, overflowY:"auto", background:"#f0fdf4", fontFamily:"Sarabun,sans-serif" }}>
          <div style={{ maxWidth:520, margin:"0 auto", paddingBottom:30 }}>
            <div style={{ background:"linear-gradient(135deg,#052e16,#065f46)", padding:`${Math.round(24*fs)}px 20px ${Math.round(28*fs)}px`, color:"white", position:"relative" }}>
              <button onClick={()=>setShowUpgrade(false)} style={{ position:"absolute", top:14, left:14, background:"rgba(255,255,255,.15)", border:"none", borderRadius:8, color:"white", fontSize:Math.round(13*fs), padding:"5px 12px", cursor:"pointer", fontFamily:"Sarabun,sans-serif" }}>← {t.cancel}</button>
              <div style={{ textAlign:"center", paddingTop:8 }}>
                <div style={{ color:"white", marginBottom:6 }}>{Ic.Gem(Math.round(44*fs))}</div>
                <div style={{ fontSize:Math.round(24*fs), fontWeight:800, marginBottom:4 }}>{t.fullVer}</div>
                {trialLeft>0 && <div style={{ marginTop:10, background:"rgba(255,255,255,.15)", borderRadius:12, padding:"7px 16px", display:"inline-flex", alignItems:"center", gap:6, fontSize:Math.round(14*fs) }}>{Ic.Hourglass(14)} {t.trial}: <strong style={{ fontSize:Math.round(18*fs), color:"#a7f3d0" }}>{trialLeft}</strong> {t.daysLeft}</div>}
              </div>
            </div>
            {/* Feature table */}
            <div style={{ margin:"16px 14px 0", background:"white", borderRadius:16, overflow:"hidden", boxShadow:"0 4px 16px rgba(0,0,0,0.08)" }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", textAlign:"center" }}>
                <div style={{ padding:"12px 8px", background:"#f8fafc", borderBottom:"1.5px solid #e5e7eb", borderRight:"1px solid #e5e7eb" }}/>
                <div style={{ padding:"12px 8px", background:"#f8fafc", borderBottom:"1.5px solid #e5e7eb", borderRight:"1px solid #e5e7eb" }}>
                  <div style={{ color:"#f59e0b" }}>{Ic.Star(Math.round(18*fs))}</div>
                  <div style={{ fontWeight:800, fontSize:Math.round(13*fs), marginTop:2 }}>{lang==="EN"?"Free":"ฟรี"}</div>
                  <div style={{ fontSize:Math.round(11*fs), color:"#64748b" }}>{TRIAL_DAYS} {lang==="EN"?"days":"วัน"}</div>
                </div>
                <div style={{ padding:"12px 8px", background:"linear-gradient(135deg,#059669,#047857)", borderBottom:"1.5px solid #059669" }}>
                  <div style={{ color:"white" }}>{Ic.Gem(Math.round(18*fs))}</div>
                  <div style={{ fontWeight:800, fontSize:Math.round(13*fs), marginTop:2, color:"white" }}>{t.fullVer}</div>
                  <div style={{ fontSize:Math.round(11*fs), color:"#a7f3d0" }}>{adminCfg.price||"—"}</div>
                </div>
              </div>
              {[
                [lang==="EN"?"Multi Patient":"หลายคนไข้","✅","✅"],
                [lang==="EN"?"Record BP":"บันทึกความดัน","✅","✅"],
                [lang==="EN"?"BP Trend Graph":"กราฟแนวโน้ม","❌","✅"],
                [lang==="EN"?"Health Advice":"คำแนะนำสุขภาพ","❌","✅"],
                [lang==="EN"?"PDF / JPG Report":"รายงาน PDF/JPG","❌","✅"],
                [lang==="EN"?"Backup & Restore":"Backup & Restore","❌","✅"],
                [lang==="EN"?"Unlimited Days":"ไม่จำกัดวัน","❌","✅"],
              ].map(([feat,free,full],i)=>(
                <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", background:i%2===0?"white":"#f8fafc", borderBottom:i<6?"1px solid #f1f5f9":"none" }}>
                  <div style={{ padding:`${Math.round(9*fs)}px 14px`, fontSize:Math.round(13*fs), color:"#475569", borderRight:"1px solid #f1f5f9" }}>{feat}</div>
                  <div style={{ padding:`${Math.round(9*fs)}px 0`, textAlign:"center", fontSize:Math.round(15*fs), borderRight:"1px solid #f1f5f9" }}>{free}</div>
                  <div style={{ padding:`${Math.round(9*fs)}px 0`, textAlign:"center", fontSize:Math.round(15*fs) }}>{full}</div>
                </div>
              ))}
            </div>
            {/* Price + CTA */}
            <div style={{ margin:"14px 14px 0", background:"white", borderRadius:16, padding:Math.round(20*fs), boxShadow:"0 4px 16px rgba(0,0,0,0.08)" }}>
              {adminCfg.price && <div style={{ textAlign:"center", marginBottom:14 }}>
                <div style={{ fontSize:Math.round(12*fs), color:"#64748b" }}>{lang==="EN"?"One-time price":"ราคาพิเศษ"}</div>
                <div style={{ fontSize:Math.round(36*fs), fontWeight:800, color:"#059669", lineHeight:1.1 }}>{adminCfg.price}</div>
                <div style={{ fontSize:Math.round(13*fs), color:"#10b981", fontWeight:700, marginTop:4 }}>{Ic.Check(14)} {lang==="EN"?"One-time payment":"จ่ายครั้งเดียว ใช้ได้ตลอด"}</div>
              </div>}
              {adminCfg.qrUrl ? (
                <div style={{ textAlign:"center", marginBottom:14 }}>
                  <div style={{ fontSize:Math.round(14*fs), fontWeight:800, color:"#065f46", marginBottom:8, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>{Ic.QR(18)} {lang==="EN"?"Scan to Pay":"สแกน QR โอนเงิน"}</div>
                  <div style={{ display:"inline-block", padding:8, background:"white", borderRadius:14, border:"2.5px solid #059669", boxShadow:"0 4px 14px rgba(5,150,105,0.2)" }}>
                    <img src={adminCfg.qrUrl} alt="QR" style={{ width:Math.round(200*fs), height:Math.round(200*fs), display:"block", borderRadius:8, objectFit:"contain" }} onError={e=>e.target.style.display="none"}/>
                  </div>
                </div>
              ) : (
                <div style={{ background:"#f0fdf4", borderRadius:12, padding:14, marginBottom:14, textAlign:"center", fontSize:Math.round(14*fs), color:"#065f46", border:"1.5px solid #a7f3d0" }}>
                  {Ic.Phone(16)} Line: <strong>{ADMIN_LINE}</strong>
                </div>
              )}
              {(adminCfg.bankName||adminCfg.accountNo) && (
                <div style={{ background:"#f0fdf4", borderRadius:12, padding:"10px 14px", marginBottom:14, fontSize:Math.round(14*fs), lineHeight:2, border:"1px solid #a7f3d0" }}>
                  {adminCfg.bankName    && <div>🏦 <strong>{adminCfg.bankName}</strong></div>}
                  {adminCfg.accountNo   && <div>{Ic.Tag(13)} <strong>{adminCfg.accountNo}</strong></div>}
                  {adminCfg.accountName && <div>{Ic.User(13)} <strong>{adminCfg.accountName}</strong></div>}
                </div>
              )}
              {adminCfg.contactPhone && <div style={{ textAlign:"center", marginBottom:14, fontSize:Math.round(14*fs) }}>{Ic.Phone(14)} <a href={`tel:${adminCfg.contactPhone}`} style={{ color:"#059669" }}>{adminCfg.contactPhone}</a></div>}
              <button onClick={()=>{setShowUpgrade(false);setShowPaywall(true);}} style={{...S.btnMain, boxShadow:"0 4px 16px rgba(5,150,105,0.35)"}}>
                {Ic.Unlock(Math.round(20*fs))} {t.unlockFull}
              </button>
              <div style={{ textAlign:"center", marginTop:10, fontSize:Math.round(12*fs), color:"#94a3b8" }}>Line: <strong>{ADMIN_LINE}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:"white", borderRadius:22, padding:26, width:"100%", maxWidth:340, textAlign:"center" }}>
            <div style={{ color:"#ef4444", marginBottom:10 }}>{Ic.Trash(Math.round(38*fs))}</div>
            <div style={{ fontWeight:800, fontSize:Math.round(19*fs), marginBottom:6 }}>
              {deleteConfirm.type==="patient" ? t.deletePatientQ : t.deleteRecordQ}
            </div>
            {deleteConfirm.type==="patient" && <div style={{ fontSize:Math.round(13*fs), color:"#64748b", marginBottom:6 }}>{t.deletePatientWarn}</div>}
            <div style={{ color:"#374151", fontWeight:700, fontSize:Math.round(16*fs), marginBottom:20 }}>
              {deleteConfirm.type==="patient" ? deleteConfirm.data.name : toThai(deleteConfirm.data.date, lang)}
            </div>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={()=>setDeleteConfirm(null)} style={{...S.btnGhost,flex:1}}>{t.cancel}</button>
              <button onClick={()=>{ deleteConfirm.type==="patient"?deletePatient(deleteConfirm.data.id):delRecord(deleteConfirm.data.id); }} style={{ flex:1, padding:Math.round(14*fs), borderRadius:11, border:"none", background:"#ef4444", color:"white", fontSize:Math.round(16*fs), fontWeight:800, fontFamily:"Sarabun,sans-serif", cursor:"pointer" }}>{t.delete}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Patient Modal (Add/Edit) ── */}
      {patientModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20, overflowY:"auto" }}>
          <div style={{ background:"white", borderRadius:22, padding:24, width:"100%", maxWidth:380, margin:"auto" }}>
            <div style={{ fontWeight:800, fontSize:Math.round(20*fs), marginBottom:18, color:"#065f46", display:"flex", alignItems:"center", gap:8 }}>
              {Ic.User(22)} {patientModal==="add" ? t.addPatient : t.editPatient}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <Inp label={t.name} value={patientForm.name} onChange={v=>setPatientForm(f=>({...f,name:v}))} placeholder={lang==="EN"?"Full name":"ชื่อ-นามสกุล"} scale={fs}/>
              <Inp label={t.phone} type="tel" value={patientForm.phone} onChange={v=>setPatientForm(f=>({...f,phone:v}))} placeholder="0xx-xxx-xxxx" scale={fs}/>
              <Inp label={t.notes} value={patientForm.notes} onChange={v=>setPatientForm(f=>({...f,notes:v}))} placeholder={lang==="EN"?"e.g. Hypertension, Diabetes":"เช่น ความดันสูง, เบาหวาน"} rows={2} scale={fs}/>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:18 }}>
              <button onClick={()=>setPatientModal(null)} style={{...S.btnGhost,flex:1}}>{t.cancel}</button>
              <button onClick={savePatient} disabled={!patientForm.name.trim()} style={{...S.btnMain,flex:1,fontSize:Math.round(16*fs)}}>
                {Ic.Check(18)} {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Modal ── */}
      {showAdmin && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:700, display:"flex", alignItems:"center", justifyContent:"center", padding:16, overflowY:"auto" }}>
          <div style={{ background:"white", borderRadius:22, padding:22, width:"100%", maxWidth:400, margin:"auto" }}>
            <div style={{ fontWeight:800, fontSize:Math.round(21*fs), marginBottom:14, color:"#059669", display:"flex", alignItems:"center", gap:8 }}>
              {Ic.Shield(22)} Admin Panel
            </div>
            {!adminAuth ? (
              <div>
                <Inp label={lang==="EN"?"Admin Password":"รหัสผ่าน Admin"} type="password" value={adminPassInput} onChange={setAdminPassInput} placeholder="password" scale={fs}/>
                <div style={{ marginTop:14, display:"flex", gap:10 }}>
                  <button onClick={()=>{ setShowAdmin(false); setAdminPassInput(""); }} style={{...S.btnGhost,flex:1}}>{t.cancel}</button>
                  <button onClick={async()=>{ setAdminLoading(true); const ok=await verifyCode("admin",adminPassInput); setAdminLoading(false); if(ok) setAdminAuth(true); else toast$("❌ Wrong password","err"); }} style={{...S.btnMain,flex:1,fontSize:Math.round(16*fs)}} disabled={adminLoading}>
                    {adminLoading ? "⏳..." : lang==="EN"?"Login":"เข้าสู่ระบบ"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ background:"#f0fdf4", borderRadius:12, padding:10, fontSize:Math.round(13*fs), color:"#065f46", lineHeight:1.8 }}>
                  {Ic.Users(14)} {patients.length} {lang==="EN"?"patients":"คนไข้"} · Line: {ADMIN_LINE}
                </div>
                <div style={{ background:"#fff7ed", borderRadius:12, padding:10, fontSize:Math.round(12*fs), color:"#92400e" }}>
                  {Ic.Info(13)} Vercel ENV: <code>UNLOCK_CODE</code>, <code>ADMIN_PASS</code>, <code>TRIAL_SECRET</code>
                </div>
                <Inp label={lang==="EN"?"Price":"ราคา Full Version"} value={adminCfg.price||""} onChange={v=>setAdminCfg(c=>({...c,price:v}))} placeholder="299 บาท" scale={fs}/>
                <Inp label={lang==="EN"?"Contact Phone":"เบอร์ติดต่อ"} value={adminCfg.contactPhone||""} onChange={v=>setAdminCfg(c=>({...c,contactPhone:v}))} placeholder="089-xxx-xxxx" scale={fs}/>
                <Inp label={lang==="EN"?"Bank Name":"ธนาคาร"} value={adminCfg.bankName||""} onChange={v=>setAdminCfg(c=>({...c,bankName:v}))} placeholder="กสิกรไทย" scale={fs}/>
                <Inp label={lang==="EN"?"Account No.":"เลขบัญชี"} value={adminCfg.accountNo||""} onChange={v=>setAdminCfg(c=>({...c,accountNo:v}))} placeholder="xxx-x-xxxxx-x" scale={fs}/>
                <Inp label={lang==="EN"?"Account Name":"ชื่อบัญชี"} value={adminCfg.accountName||""} onChange={v=>setAdminCfg(c=>({...c,accountName:v}))} placeholder="ชื่อ นามสกุล" scale={fs}/>
                <Inp label="QR Code URL" value={adminCfg.qrUrl||""} onChange={v=>setAdminCfg(c=>({...c,qrUrl:v}))} placeholder="https://..." scale={fs}/>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>{ setShowAdmin(false); setAdminAuth(false); setAdminPassInput(""); }} style={{...S.btnGhost,flex:1}}>{t.close}</button>
                  <button onClick={()=>{ lsSet(KEY_ADMIN,adminCfg); toast$(lang==="EN"?"Saved":"บันทึกแล้ว"); setShowAdmin(false); setAdminAuth(false); setAdminPassInput(""); }} style={{...S.btnMain,flex:1,fontSize:Math.round(16*fs)}}>
                    {Ic.Check(18)} {t.saveInfo}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════ HEADER ══════════════════ */}
      <div style={S.header}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:Math.round(10*fs), opacity:.75, letterSpacing:".1em", textTransform:"uppercase", marginBottom:2 }}>{t.appSub}</div>
            <div style={{ fontSize:Math.round(24*fs), fontWeight:800, display:"flex", alignItems:"center", gap:8 }}>
              {Ic.Heart(Math.round(22*fs))} {t.appName}
            </div>
            {activePatient && (
              <button onClick={()=>setTab("patients")} style={{ marginTop:6, display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.18)", border:"none", borderRadius:10, color:"white", fontSize:Math.round(14*fs), fontFamily:"Sarabun,sans-serif", padding:`${Math.round(5*fs)}px ${Math.round(12*fs)}px`, cursor:"pointer", fontWeight:700 }}>
                {Ic.User(Math.round(14*fs))} {activePatient.name} <span style={{ opacity:.7 }}>↓</span>
              </button>
            )}
            {!isUnlocked && (
              <div style={{ marginTop:6, fontSize:Math.round(11*fs), background:"rgba(255,255,255,.18)", borderRadius:8, padding:"3px 10px", display:"inline-flex", alignItems:"center", gap:4 }}>
                {Ic.Hourglass(11)} {t.trial}: {trialLeft} {t.daysLeft}
              </div>
            )}
            {isUnlocked && (
              <div style={{ marginTop:6, fontSize:Math.round(11*fs), background:"rgba(255,255,255,.18)", borderRadius:8, padding:"3px 10px", display:"inline-flex", alignItems:"center", gap:4 }}>
                {Ic.Gem(11)} {t.fullVer}
              </div>
            )}
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
            <div style={{ background:"rgba(255,255,255,.18)", borderRadius:12, padding:`${Math.round(6*fs)}px ${Math.round(12*fs)}px`, textAlign:"center" }}>
              <div style={{ fontSize:Math.round(26*fs), fontWeight:800, lineHeight:1 }}>{patients.length}</div>
              <div style={{ fontSize:Math.round(10*fs), opacity:.85 }}>{lang==="EN"?"patients":"คนไข้"}</div>
            </div>
            <button onClick={handleVerTap} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:7, color:"white", fontSize:Math.round(10*fs), padding:"3px 10px", cursor:"pointer", fontFamily:"Sarabun,sans-serif" }}>
              {APP_VERSION}
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════ PATIENTS TAB ══════════════════ */}
      {tab==="patients" && (
        <div style={{ paddingTop:16 }}>
          <div style={{ padding:"0 14px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontWeight:800, fontSize:Math.round(20*fs), color:"#065f46", display:"flex", alignItems:"center", gap:8 }}>
              {Ic.Users(Math.round(22*fs))} {t.patients}
            </div>
            <button onClick={openAddPatient} style={{...S.btnMain, width:"auto", padding:`${Math.round(11*fs)}px ${Math.round(18*fs)}px`, fontSize:Math.round(15*fs)}}>
              {Ic.Plus(Math.round(16*fs))} {t.addPatient}
            </button>
          </div>

          {/* Local-only notice */}
          <div style={{ margin:"0 14px 12px", background:"#ecfdf5", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:8, fontSize:Math.round(13*fs), color:"#065f46", border:"1px solid #a7f3d0" }}>
            {Ic.Shield(14)} {t.storageNote}
          </div>

          {patients.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"#9ca3af" }}>
              <div style={{ color:"#d1d5db", marginBottom:14 }}>{Ic.Users(60)}</div>
              <div style={{ fontWeight:800, fontSize:Math.round(20*fs), marginBottom:6 }}>{t.noPatients}</div>
              <div style={{ fontSize:Math.round(15*fs) }}>{t.addFirst}</div>
            </div>
          ) : (
            patients.map(p => {
              const pRecs = lsGet(recKey(p.id), []);
              const isActive = p.id === activePid;
              const last = pRecs[pRecs.length-1];
              const ms = bpStatus(last?.morningSys, last?.morningDia);
              const es = bpStatus(last?.eveningSys, last?.eveningDia);
              const worst = rank(ms)>=rank(es) ? (ms||es) : (es||ms);
              return (
                <div key={p.id} style={{ ...S.card, borderLeft:`5px solid ${isActive?"#059669":"#e5e7eb"}`, cursor:"pointer" }} onClick={()=>selectPatient(p.id)}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <div style={{ width:Math.round(38*fs), height:Math.round(38*fs), borderRadius:"50%", background: isActive?"#059669":"#e5e7eb", color: isActive?"white":"#64748b", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:Math.round(16*fs), flexShrink:0 }}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:800, fontSize:Math.round(17*fs), color:"#111827" }}>{p.name}</div>
                          {p.phone && <div style={{ fontSize:Math.round(13*fs), color:"#6b7280", display:"flex", alignItems:"center", gap:4 }}>{Ic.Phone(12)} {p.phone}</div>}
                          {p.notes && <div style={{ fontSize:Math.round(12*fs), color:"#9ca3af" }}>{p.notes}</div>}
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:6 }}>
                        <span style={{ fontSize:Math.round(13*fs), color:"#6b7280" }}>{pRecs.length} {t.records}</span>
                        {last && worst && <span style={{ ...S.badge(worst), fontSize:Math.round(11*fs) }}>{bpLab(worst,lang)}</span>}
                        {last && <span style={{ fontSize:Math.round(12*fs), color:"#9ca3af" }}>{toThai(last.date,lang)}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6, alignItems:"center", marginLeft:8 }}>
                      {isActive && <span style={{ background:"#d1fae5", color:"#065f46", fontSize:Math.round(11*fs), fontWeight:800, padding:"3px 10px", borderRadius:20 }}>Active</span>}
                      <button onClick={e=>{e.stopPropagation();openEditPatient(p);}} style={{ background:"#f0fdf4", border:"none", borderRadius:8, cursor:"pointer", padding:`${Math.round(5*fs)}px ${Math.round(10*fs)}px`, color:"#059669" }}>
                        {Ic.Edit(Math.round(16*fs))}
                      </button>
                      <button onClick={e=>{e.stopPropagation();setDeleteConfirm({type:"patient",data:p});}} style={{ background:"none", border:"none", cursor:"pointer", color:"#d1d5db", padding:4 }}>
                        {Ic.X(Math.round(20*fs))}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Trial banner */}
          {!isUnlocked && (
            <div style={{ margin:"0 14px 14px" }}>
              <button onClick={()=>setShowUpgrade(true)} style={{ width:"100%", background:"linear-gradient(135deg,#052e16,#065f46)", border:"none", borderRadius:16, padding:`${Math.round(15*fs)}px ${Math.round(18*fs)}px`, cursor:"pointer", fontFamily:"Sarabun,sans-serif", textAlign:"left", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ color:"white" }}>{Ic.Gem(Math.round(30*fs))}</div>
                <div style={{ flex:1 }}>
                  <div style={{ color:"white", fontWeight:800, fontSize:Math.round(14*fs), marginBottom:2 }}>{t.upgrade}</div>
                  <div style={{ color:"#6ee7b7", fontSize:Math.round(12*fs) }}>{lang==="EN"?"Graph · Advice · PDF · Unlimited Days":"กราฟ · คำแนะนำ · PDF · ไม่จำกัดวัน"}{adminCfg.price?` · ${adminCfg.price}`:""}</div>
                </div>
                <div style={{ color:"#6ee7b7", fontSize:Math.round(20*fs) }}>›</div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ RECORD TAB ══════════════════ */}
      {tab==="record" && (
        <div style={{ paddingTop:16 }}>
          {!activePatient ? (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <div style={{ color:"#d1d5db", marginBottom:12 }}>{Ic.Users(50)}</div>
              <div style={{ fontWeight:700, fontSize:Math.round(17*fs), color:"#9ca3af", marginBottom:14 }}>{t.selectFirst}</div>
              <button onClick={()=>setTab("patients")} style={{...S.btnMain,width:"auto",padding:`${Math.round(14*fs)}px ${Math.round(28*fs)}px`}}>
                {Ic.Users(18)} {t.patients}
              </button>
            </div>
          ) : (
            <>
              {editRecord && (
                <div style={{ margin:"0 14px 10px", background:"#fef9c3", borderRadius:11, padding:"9px 14px", fontSize:Math.round(13*fs), color:"#92400e", fontWeight:700, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span>{Ic.Edit(14)} {lang==="EN"?"Editing":"แก้ไข"}: {toThai(editRecord.date,lang)}</span>
                  <button onClick={()=>{setEditRecord(null);setForm(emptyForm);}} style={{ background:"none", border:"none", cursor:"pointer", color:"#9a3412", fontSize:18 }}>✕</button>
                </div>
              )}
              {/* Active patient info */}
              <div style={{ margin:"0 14px 12px", background:"#f0fdf4", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, border:"1px solid #a7f3d0" }}>
                <div style={{ width:Math.round(36*fs), height:Math.round(36*fs), borderRadius:"50%", background:"#059669", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:Math.round(16*fs), flexShrink:0 }}>
                  {activePatient.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:Math.round(15*fs), color:"#065f46" }}>{activePatient.name}</div>
                  {activePatient.phone && <div style={{ fontSize:Math.round(12*fs), color:"#6b7280" }}>{Ic.Phone(12)} {activePatient.phone}</div>}
                </div>
                <div style={{ fontSize:Math.round(13*fs), color:"#6b7280" }}>{records.length} {t.records}</div>
              </div>

              {/* Date */}
              <div style={S.card}>
                <Inp label={t.date} type="date" value={form.date} onChange={setF("date")} scale={fs}/>
                {(()=>{const ex=records.find(r=>r.date===form.date);return ex
                  ?<div style={{marginTop:10,fontSize:Math.round(13*fs),background:"#fefce8",borderRadius:9,padding:"9px 12px",border:"1px solid #fde68a"}}><div style={{fontWeight:700,color:"#92400e",marginBottom:2,display:"flex",alignItems:"center",gap:4}}>{Ic.Edit(13)} {t.existingData}</div><div style={{color:"#78350f"}}>{ex.morningSys?`${ex.morningSys}/${ex.morningDia}`:""} {ex.eveningSys?`· ${ex.eveningSys}/${ex.eveningDia}`:""}</div></div>
                  :<div style={{marginTop:10,fontSize:Math.round(13*fs),color:"#9ca3af",background:"#f9fafb",borderRadius:9,padding:"7px 12px"}}>{t.newDay}</div>;
                })()}
              </div>

              {/* Morning */}
              <div style={{...S.card, borderTop:"4px solid #f59e0b"}}>
                <div style={{...S.secTitle, color:"#b45309"}}>
                  <span style={{color:"#f59e0b"}}>{Ic.Sun(Math.round(22*fs))}</span>
                  {t.morning}
                  {mStatus && <span style={S.badge(mStatus)}>{bpLab(mStatus,lang)}</span>}
                </div>
                <div style={{marginBottom:Math.round(12*fs)}}><Inp label={t.time} type="time" value={form.morningTime} onChange={setF("morningTime")} scale={fs}/></div>
                <div style={S.grid2}>
                  <Inp label={t.upper} type="number" value={form.morningSys} onChange={setF("morningSys")} placeholder="120" unit="mmHg" scale={fs}/>
                  <Inp label={t.lower} type="number" value={form.morningDia} onChange={setF("morningDia")} placeholder="80" unit="mmHg" scale={fs}/>
                </div>
                <div style={{marginTop:Math.round(12*fs)}}><Inp label={t.pulse} type="number" value={form.morningPulse} onChange={setF("morningPulse")} placeholder="75" unit="bpm" scale={fs}/></div>
              </div>

              {/* Evening */}
              <div style={{...S.card, borderTop:"4px solid #3b82f6"}}>
                <div style={{...S.secTitle, color:"#1d4ed8"}}>
                  <span style={{color:"#3b82f6"}}>{Ic.Moon(Math.round(22*fs))}</span>
                  {t.evening}
                  {eStatus && <span style={S.badge(eStatus)}>{bpLab(eStatus,lang)}</span>}
                </div>
                <div style={{marginBottom:Math.round(12*fs)}}><Inp label={t.time} type="time" value={form.eveningTime} onChange={setF("eveningTime")} scale={fs}/></div>
                <div style={S.grid2}>
                  <Inp label={t.upper} type="number" value={form.eveningSys} onChange={setF("eveningSys")} placeholder="120" unit="mmHg" scale={fs}/>
                  <Inp label={t.lower} type="number" value={form.eveningDia} onChange={setF("eveningDia")} placeholder="80" unit="mmHg" scale={fs}/>
                </div>
                <div style={{marginTop:Math.round(12*fs)}}><Inp label={t.pulse} type="number" value={form.eveningPulse} onChange={setF("eveningPulse")} placeholder="75" unit="bpm" scale={fs}/></div>
              </div>

              <div style={{padding:`0 14px ${Math.round(16*fs)}px`}}>
                <button onClick={submit} disabled={saving} style={S.btnMain}>
                  {saving ? t.saving : t.saveRecord}
                </button>
              </div>

              {/* BP reference */}
              <div style={S.card}>
                <div style={{fontWeight:800, marginBottom:10, fontSize:Math.round(16*fs), display:"flex", alignItems:"center", gap:6}}>{Ic.Chart(16)} {lang==="EN"?"BP Level Guide":"เกณฑ์ระดับความดัน"}</div>
                {[
                  {lTH:"ปกติ",lEN:"Normal",range:"< 120/80",bg:"#d1fae5",fg:"#065f46"},
                  {lTH:"สูงเล็กน้อย",lEN:"Elevated",range:"120–129/< 80",bg:"#fef9c3",fg:"#854d0e"},
                  {lTH:"สูงระดับ 1",lEN:"High Stage 1",range:"130–139/80–89",bg:"#ffedd5",fg:"#9a3412"},
                  {lTH:"สูงระดับ 2",lEN:"High Stage 2",range:"≥ 140/≥ 90",bg:"#fee2e2",fg:"#991b1b"},
                ].map(s=>(
                  <div key={s.lTH} style={{display:"flex",alignItems:"center",gap:10,marginBottom:7}}>
                    <span style={{...S.badge(s), minWidth:Math.round(108*fs), textAlign:"center"}}>{lang==="EN"?s.lEN:s.lTH}</span>
                    <span style={{color:"#475569",fontSize:Math.round(14*fs)}}>{s.range} mmHg</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════ HISTORY TAB ══════════════════ */}
      {tab==="history" && (
        <div style={{paddingTop:16}}>
          {!activePatient ? (
            <div style={{textAlign:"center",padding:"60px 20px"}}>
              <div style={{color:"#d1d5db",marginBottom:12}}>{Ic.List(50)}</div>
              <div style={{fontWeight:700,fontSize:Math.round(16*fs),color:"#9ca3af",marginBottom:14}}>{t.selectFirst}</div>
              <button onClick={()=>setTab("patients")} style={{...S.btnMain,width:"auto",padding:`${Math.round(13*fs)}px ${Math.round(28*fs)}px`}}>{Ic.Users(18)} {t.patients}</button>
            </div>
          ) : (
            <>
              <div style={{padding:`0 14px ${Math.round(12*fs)}px`, display:"flex", gap:10}}>
                <button style={S.btnGhost} onClick={()=>setTab("report")}>{Ic.Camera(Math.round(16*fs))} {t.report}</button>
                {isPremium
                  ? <button style={S.btnGhost} onClick={doPrint}>{Ic.Print(Math.round(16*fs))} A4</button>
                  : <button style={{...S.btnGhost,opacity:.45,borderColor:"#d1d5db",color:"#9ca3af"}} onClick={()=>setShowUpgrade(true)}>{Ic.Lock(14)} A4</button>
                }
              </div>

              {/* Graph */}
              {records.length>=2 && (isPremium
                ? <div style={S.card}><div style={{fontWeight:800,fontSize:Math.round(16*fs),marginBottom:10,display:"flex",alignItems:"center",gap:6}}>{Ic.Chart(16)} {t.graph}</div><BPGraph records={records} lang={lang}/></div>
                : <div style={{...S.card,opacity:.75}}><div style={{fontWeight:700,fontSize:Math.round(14*fs),color:"#9ca3af",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>{Ic.Lock(14)} {t.graph}</div><button onClick={()=>setShowUpgrade(true)} style={{...S.btnMain,fontSize:Math.round(14*fs),padding:12,background:"linear-gradient(135deg,#052e16,#065f46)"}}>{Ic.Gem(14)} {t.upgrade}</button></div>
              )}

              {/* Health advice */}
              {rec && isPremium && (
                <div style={{...S.card, borderLeft:`5px solid ${rec.status?.bar||"#10b981"}`}}>
                  <div style={{fontWeight:800,fontSize:Math.round(16*fs),marginBottom:8,display:"flex",alignItems:"center",gap:6}}>{Ic.Heart(16)} {t.advice}</div>
                  <div style={{fontSize:Math.round(13*fs),color:"#475569",marginBottom:8}}>{lang==="EN"?"7-day avg:":"ค่าเฉลี่ย 7 วัน:"} <strong style={{color:rec.status?.fg}}>{rec.avgS}/{rec.avgD} mmHg</strong>{rec.status&&<span style={{...S.badge(rec.status),marginLeft:8,fontSize:Math.round(11*fs)}}>{bpLab(rec.status,lang)}</span>}</div>
                  {rec.tips[lang].map((tip,i)=><div key={i} style={{fontSize:Math.round(13*fs),color:"#334155",padding:"5px 0",borderBottom:i<rec.tips[lang].length-1?"1px solid #f1f5f9":""}}>{tip}</div>)}
                  <div style={{fontSize:Math.round(11*fs),color:"#94a3b8",marginTop:8}}>{t.ref}</div>
                </div>
              )}

              {records.length===0 ? (
                <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>
                  <div style={{color:"#d1d5db",marginBottom:12}}>{Ic.List(50)}</div>
                  <div style={{fontWeight:800,fontSize:Math.round(19*fs)}}>{t.noData}</div>
                  <div style={{fontSize:Math.round(15*fs),marginTop:4}}>{t.startRecord}</div>
                </div>
              ) : (
                [...records].reverse().map(r=>{
                  const ms=bpStatus(r.morningSys,r.morningDia), es=bpStatus(r.eveningSys,r.eveningDia);
                  const worst=rank(ms)>=rank(es)?(ms||es):(es||ms);
                  return (
                    <div key={r.id} style={{...S.histCard, borderLeftColor:worst?worst.bar:"#e5e7eb"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                        <div>
                          <div style={{fontWeight:800,fontSize:Math.round(18*fs)}}>{toThai(r.date,lang)}</div>
                          {worst&&<span style={{...S.badge(worst),marginTop:5,display:"inline-block"}}>{bpLab(worst,lang)}</span>}
                        </div>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>openEdit(r)} style={{background:"#f0fdf4",border:"none",borderRadius:8,cursor:"pointer",padding:`${Math.round(4*fs)}px ${Math.round(10*fs)}px`,color:"#059669"}}>{Ic.Edit(Math.round(17*fs))}</button>
                          <button onClick={()=>setDeleteConfirm({type:"record",data:r})} style={{background:"none",border:"none",cursor:"pointer",color:"#d1d5db",padding:4}}>{Ic.X(Math.round(20*fs))}</button>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        {r.morningSys
                          ?<div style={{background:"#fefce8",borderRadius:11,padding:"11px 13px"}}>
                            <div style={{fontSize:Math.round(11*fs),color:"#92400e",fontWeight:700,marginBottom:3,display:"flex",alignItems:"center",gap:3}}>{Ic.Sun(11)} {t.morning} {r.morningTime&&`· ${r.morningTime}`}</div>
                            <div style={{fontSize:Math.round(27*fs),fontWeight:800,lineHeight:1.1}}>{r.morningSys}<span style={{fontSize:Math.round(16*fs)}}>/{r.morningDia}</span></div>
                            <div style={{fontSize:Math.round(12*fs),color:"#6b7280",marginTop:2}}>{Ic.Heart(11)} {r.morningPulse} bpm</div>
                          </div>
                          :<div style={{background:"#f9fafb",borderRadius:11,padding:"11px 13px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <button onClick={()=>openEdit(r)} style={{background:"none",border:"1.5px dashed #d1d5db",borderRadius:9,padding:"6px 12px",color:"#9ca3af",fontSize:Math.round(12*fs),cursor:"pointer",fontFamily:"Sarabun,sans-serif"}}>{t.editMorning}</button>
                          </div>
                        }
                        {r.eveningSys
                          ?<div style={{background:"#eff6ff",borderRadius:11,padding:"11px 13px"}}>
                            <div style={{fontSize:Math.round(11*fs),color:"#1d4ed8",fontWeight:700,marginBottom:3,display:"flex",alignItems:"center",gap:3}}>{Ic.Moon(11)} {t.evening.split(" /")[0]} {r.eveningTime&&`· ${r.eveningTime}`}</div>
                            <div style={{fontSize:Math.round(27*fs),fontWeight:800,lineHeight:1.1}}>{r.eveningSys}<span style={{fontSize:Math.round(16*fs)}}>/{r.eveningDia}</span></div>
                            <div style={{fontSize:Math.round(12*fs),color:"#6b7280",marginTop:2}}>{Ic.Heart(11)} {r.eveningPulse} bpm</div>
                          </div>
                          :<div style={{background:"#f9fafb",borderRadius:11,padding:"11px 13px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <button onClick={()=>openEdit(r)} style={{background:"none",border:"1.5px dashed #d1d5db",borderRadius:9,padding:"6px 12px",color:"#9ca3af",fontSize:Math.round(12*fs),cursor:"pointer",fontFamily:"Sarabun,sans-serif"}}>{t.editEvening}</button>
                          </div>
                        }
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════ REPORT TAB ══════════════════ */}
      {tab==="report" && (
        <div style={{paddingTop:16}}>
          {!activePatient ? (
            <div style={{textAlign:"center",padding:"60px 20px"}}>
              <div style={{color:"#d1d5db",marginBottom:12}}>{Ic.Camera(50)}</div>
              <div style={{fontWeight:700,fontSize:Math.round(16*fs),color:"#9ca3af",marginBottom:14}}>{t.selectFirst}</div>
              <button onClick={()=>setTab("patients")} style={{...S.btnMain,width:"auto",padding:`${Math.round(13*fs)}px ${Math.round(28*fs)}px`}}>{Ic.Users(18)} {t.patients}</button>
            </div>
          ) : (
            <>
              <div style={{padding:`0 14px ${Math.round(12*fs)}px`}}>
                {isPremium ? (
                  <>
                    <button onClick={saveJPG} disabled={capturing} style={{...S.btnMain, background:capturing?"#94a3b8":"linear-gradient(135deg,#0f766e,#0d9488)", marginBottom:10}}>
                      {Ic.Camera(Math.round(18*fs))} {capturing?(lang==="EN"?"Creating...":"กำลังสร้าง..."):t.saveJPG}
                    </button>
                    <button onClick={doPrint} style={{...S.btnGhost,width:"100%"}}>
                      {Ic.Print(Math.round(17*fs))} {t.printA4}
                    </button>
                  </>
                ) : (
                  <div style={{background:"#f9fafb",borderRadius:14,padding:20,textAlign:"center",border:"2px dashed #e5e7eb"}}>
                    <div style={{color:"#d1d5db",marginBottom:8}}>{Ic.Lock(Math.round(30*fs))}</div>
                    <div style={{fontWeight:800,fontSize:Math.round(15*fs),color:"#0f172a",marginBottom:10}}>{lang==="EN"?"JPG / PDF requires Full Version":"รายงาน JPG / PDF เป็น Full Version"}</div>
                    <button onClick={()=>setShowUpgrade(true)} style={{...S.btnMain,fontSize:Math.round(15*fs)}}>{Ic.Gem(16)} {t.upgrade}</button>
                  </div>
                )}
              </div>

              {/* Report preview */}
              <div ref={reportRef} style={{margin:"0 14px 14px",background:"white",borderRadius:16,padding:Math.round(18*fs),boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>
                <div style={{borderBottom:"3px solid #059669",paddingBottom:12,marginBottom:12,textAlign:"center"}}>
                  <div style={{fontSize:Math.round(18*fs),fontWeight:800,color:"#065f46",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{Ic.Heart(18)} {lang==="EN"?"BP Report":"รายงานความดันโลหิต"}</div>
                  {activePatient && <div style={{fontSize:Math.round(14*fs),color:"#475569",marginTop:4}}>{activePatient.name}{activePatient.phone?` · ${activePatient.phone}`:""}</div>}
                  {activePatient?.notes && <div style={{fontSize:Math.round(12*fs),color:"#9ca3af"}}>{activePatient.notes}</div>}
                  <div style={{fontSize:Math.round(12*fs),color:"#9ca3af",marginTop:2}}>{toThai(todayISO(),lang)} · {records.length} {t.records} · {APP_VERSION}</div>
                </div>
                {records.length===0
                  ? <div style={{textAlign:"center",padding:"24px 0",color:"#94a3b8",fontSize:Math.round(15*fs)}}>{t.noData}</div>
                  : (
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr>
                          <th style={{border:"1.5px solid #e5e7eb",padding:"6px 8px",background:"#f0fdf4",fontSize:Math.round(11*fs),textAlign:"left"}}>{t.date}</th>
                          <th colSpan={3} style={{border:"1.5px solid #e5e7eb",padding:"6px 4px",background:"#fefce8",fontSize:Math.round(11*fs)}}>{t.morning}</th>
                          <th colSpan={3} style={{border:"1.5px solid #e5e7eb",padding:"6px 4px",background:"#eff6ff",fontSize:Math.round(11*fs)}}>{t.evening.split(" /")[0]}</th>
                          <th style={{border:"1.5px solid #e5e7eb",padding:"6px 4px",background:"#f0fdf4",fontSize:Math.round(11*fs)}}>{lang==="EN"?"Status":"สถานะ"}</th>
                        </tr>
                        <tr>
                          <th style={{border:"1.5px solid #e5e7eb",padding:"3px 8px"}}/>
                          {[t.time,t.upper,t.lower,t.time,t.upper,t.lower].map((h,i)=>(
                            <th key={i} style={{border:"1.5px solid #e5e7eb",padding:"3px 5px",background:i<3?"#fefce8":"#eff6ff",fontSize:Math.round(10*fs),fontWeight:600}}>{h}</th>
                          ))}
                          <th style={{border:"1.5px solid #e5e7eb",padding:"3px 5px"}}/>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((r,i)=>{
                          const ms=bpStatus(r.morningSys,r.morningDia), es=bpStatus(r.eveningSys,r.eveningDia);
                          const w=rank(ms)>=rank(es)?(ms||es):(es||ms);
                          return (
                            <tr key={r.id} style={{background:i%2===0?"white":"#f9fafb"}}>
                              <td style={{border:"1.5px solid #e5e7eb",padding:"6px 8px",fontWeight:700,fontSize:Math.round(11*fs),whiteSpace:"nowrap"}}>{toThai(r.date,lang)}</td>
                              <td style={{border:"1.5px solid #e5e7eb",padding:"6px 5px",textAlign:"center",fontSize:Math.round(10*fs),color:"#92400e"}}>{r.morningTime||"–"}</td>
                              <td style={{border:"1.5px solid #e5e7eb",padding:"6px 5px",textAlign:"center",fontWeight:800,fontSize:Math.round(13*fs),color:ms?ms.fg:"#111"}}>{r.morningSys||"–"}</td>
                              <td style={{border:"1.5px solid #e5e7eb",padding:"6px 5px",textAlign:"center",fontWeight:700,fontSize:Math.round(12*fs)}}>{r.morningDia||"–"}</td>
                              <td style={{border:"1.5px solid #e5e7eb",padding:"6px 5px",textAlign:"center",fontSize:Math.round(10*fs),color:"#1d4ed8"}}>{r.eveningTime||"–"}</td>
                              <td style={{border:"1.5px solid #e5e7eb",padding:"6px 5px",textAlign:"center",fontWeight:800,fontSize:Math.round(13*fs),color:es?es.fg:"#111"}}>{r.eveningSys||"–"}</td>
                              <td style={{border:"1.5px solid #e5e7eb",padding:"6px 5px",textAlign:"center",fontWeight:700,fontSize:Math.round(12*fs)}}>{r.eveningDia||"–"}</td>
                              <td style={{border:"1.5px solid #e5e7eb",padding:"6px 4px",textAlign:"center"}}>{w&&<span style={{...S.badge(w),fontSize:Math.round(9*fs),padding:"1px 5px"}}>{bpLab(w,lang)}</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
              </div>
              <div style={{textAlign:"center",fontSize:Math.round(12*fs),color:"#9ca3af",padding:`0 14px ${Math.round(16*fs)}px`,lineHeight:1.8}}>
                {lang==="EN"?"iOS: Share → Save Image · Android: Auto download":"💡 iOS: กด Share → Save Image · Android: ดาวน์โหลดอัตโนมัติ"}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════ SETTINGS TAB ══════════════════ */}
      {tab==="settings" && (
        <div style={{paddingTop:16}}>
          {/* Font Size & Language */}
          <div style={S.card}>
            <div style={{fontWeight:800,fontSize:Math.round(18*fs),marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              {Ic.Text(18)} {t.fontSize} & {t.language}
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:Math.round(14*fs),fontWeight:700,color:"#374151",marginBottom:8}}>{t.fontSize}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {[["small",t.small],["medium",t.medium],["large",t.large],["xlarge",t.xlarge]].map(([val,label])=>(
                  <button key={val} onClick={()=>changeFontScale(val)} style={{padding:`${Math.round(9*fs)}px 4px`,borderRadius:9,border:`2px solid ${fontScale===val?"#059669":"#e5e7eb"}`,background:fontScale===val?"#f0fdf4":"white",color:fontScale===val?"#059669":"#6b7280",fontSize:Math.round(13*(FS[val]||1)),fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer"}}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:Math.round(14*fs),fontWeight:700,color:"#374151",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>{Ic.Globe(15)} {t.language}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["TH","🇹🇭 ภาษาไทย"],["EN","🇬🇧 English"]].map(([val,label])=>(
                  <button key={val} onClick={()=>changeLang(val)} style={{padding:`${Math.round(12*fs)}px`,borderRadius:11,border:`2px solid ${lang===val?"#059669":"#e5e7eb"}`,background:lang===val?"#f0fdf4":"white",color:lang===val?"#059669":"#6b7280",fontSize:Math.round(14*fs),fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer"}}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trial / Unlock status */}
          {!isUnlocked
            ? <div style={{...S.card, borderLeft:"5px solid #f59e0b", background:"#fffbeb"}}>
                <div style={{fontWeight:800,fontSize:Math.round(18*fs),marginBottom:6,color:"#92400e",display:"flex",alignItems:"center",gap:8}}>{Ic.Hourglass(18)} {t.trial}</div>
                <div style={{fontSize:Math.round(14*fs),color:"#78350f",marginBottom:12}}>{lang==="EN"?"Used":"ใช้ไป"} <strong>{daysUsed}</strong> {lang==="EN"?"days":"วัน"} · {lang==="EN"?"Left":"เหลือ"} <strong style={{fontSize:Math.round(20*fs),color:"#ef4444"}}>{trialLeft}</strong> {t.daysLeft}</div>
                <button onClick={()=>setShowUpgrade(true)} style={{...S.btnMain,background:"linear-gradient(135deg,#d97706,#b45309)"}}>{Ic.Gem(18)} {t.upgrade}</button>
              </div>
            : <div style={{...S.card, borderLeft:"5px solid #10b981"}}>
                <div style={{fontWeight:800,fontSize:Math.round(18*fs),color:"#065f46",display:"flex",alignItems:"center",gap:8}}>{Ic.Gem(18)} {t.fullVer} ✓</div>
              </div>
          }

          {/* Backup & Restore */}
          <div style={{...S.card, borderTop:"4px solid #7c3aed"}}>
            <div style={{fontWeight:800,fontSize:Math.round(18*fs),marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
              {Ic.Download(18)} Backup & Restore
            </div>
            <div style={{fontSize:Math.round(13*fs),color:"#6b7280",marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
              {Ic.Shield(13)} {t.storageNote}
            </div>

            {/* Backup One */}
            {activePatient && isPremium && (
              <div style={{background:"#f5f3ff",borderRadius:13,padding:14,marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:Math.round(14*fs),color:"#5b21b6",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>{Ic.User(14)} {lang==="EN"?"Backup current patient":"Backup คนไข้ปัจจุบัน"}: <strong>{activePatient.name}</strong></div>
                <button onClick={backupOne} style={{...S.btnMain,background:"linear-gradient(135deg,#7c3aed,#6d28d9)",fontSize:Math.round(15*fs)}}>
                  {Ic.Download(16)} {t.backupDevice}
                </button>
              </div>
            )}

            {/* Backup All */}
            {isPremium && (
              <div style={{background:"#f0fdf4",borderRadius:13,padding:14,marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:Math.round(14*fs),color:"#065f46",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>{Ic.Users(14)} {lang==="EN"?"Backup all":"Backup ทั้งหมด"}: {patients.length} {lang==="EN"?"patients":"คนไข้"}</div>
                <button onClick={backupAll} style={{...S.btnMain,background:"linear-gradient(135deg,#059669,#047857)",fontSize:Math.round(15*fs)}}>
                  {Ic.Download(16)} {t.backupAll}
                </button>
              </div>
            )}

            {!isPremium && (
              <div style={{background:"#f9fafb",borderRadius:13,padding:14,marginBottom:12,border:"2px dashed #e5e7eb",textAlign:"center"}}>
                <div style={{color:"#d1d5db",marginBottom:6}}>{Ic.Lock(24)}</div>
                <div style={{fontSize:Math.round(13*fs),color:"#9ca3af",marginBottom:10}}>{lang==="EN"?"Backup requires Full Version":"Backup เป็น Full Version"}</div>
                <button onClick={()=>setShowUpgrade(true)} style={{...S.btnMain,fontSize:Math.round(14*fs)}}>{Ic.Gem(14)} {t.upgrade}</button>
              </div>
            )}

            {/* Restore */}
            <div style={{background:"#fff7ed",borderRadius:13,padding:14}}>
              <div style={{fontWeight:700,fontSize:Math.round(14*fs),color:"#c2410c",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>{Ic.Upload(14)} {t.restoreFile}</div>
              <label style={{...S.btnGhost, width:"100%", boxSizing:"border-box", cursor:"pointer", borderColor:"#c2410c", color:"#c2410c", border:"1.5px solid #c2410c", borderRadius:11, padding:Math.round(13*fs), justifyContent:"center", fontFamily:"Sarabun,sans-serif", fontSize:Math.round(15*fs), fontWeight:700}}>
                {Ic.Upload(16)} {t.restoreFile}
                <input type="file" accept=".json" onChange={importFile} style={{display:"none"}}/>
              </label>
              <div style={{marginTop:8,fontSize:Math.round(11*fs),color:"#9ca3af"}}>{lang==="EN"?"Supports single-patient and all-patients formats":"รองรับทั้งไฟล์คนเดียวและไฟล์ทุกคนไข้"}</div>
            </div>
          </div>

          {/* PWA Install */}
          <div style={S.card}>
            <div style={{fontWeight:800,fontSize:Math.round(18*fs),marginBottom:12,display:"flex",alignItems:"center",gap:8}}>{Ic.Mobile(18)} {lang==="EN"?"Install App":"ติดตั้งแอป"}</div>
            <button onClick={doInstall} style={{...S.btnMain, background: isInstalled?"#94a3b8":"linear-gradient(135deg,#059669,#047857)"}}>
              {isInstalled ? <>✅ {t.addedToHome}</> : <>{Ic.Mobile(18)} {t.addToHome}</>}
            </button>
          </div>

          {/* Danger zone */}
          {activePatient && (
            <div style={S.card}>
              <button onClick={()=>setShowDeleteZone(v=>!v)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"Sarabun,sans-serif",fontSize:Math.round(13*fs),color:"#9ca3af",padding:0,display:"flex",alignItems:"center",gap:6}}>
                {Ic.Warn(13)} {showDeleteZone?t.hideAdvanced:t.advanced}
              </button>
              {showDeleteZone && (
                <div style={{marginTop:14,borderTop:"2px dashed #fee2e2",paddingTop:14}}>
                  <div style={{fontWeight:800,fontSize:Math.round(16*fs),marginBottom:6,color:"#ef4444",display:"flex",alignItems:"center",gap:6}}>{Ic.Warn(16)} {t.deleteAll}</div>
                  <div style={{fontSize:Math.round(12*fs),color:"#6b7280",marginBottom:10}}>{lang==="EN"?"This only deletes records — patient profile stays":"ลบแค่ข้อมูลความดัน — ข้อมูลคนไข้ยังอยู่"}</div>
                  <button onClick={()=>{if(window.confirm(lang==="EN"?"Delete all records for this patient?":"ยืนยันลบข้อมูลความดันทั้งหมดของคนไข้นี้?")){setRecords([]);lsSet(recKey(activePid),[]);toast$(lang==="EN"?"All records deleted":"ล้างข้อมูลแล้ว");}}} style={{width:"100%",padding:Math.round(13*fs),borderRadius:11,border:"2px solid #ef4444",background:"white",color:"#ef4444",fontSize:Math.round(16*fs),fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {Ic.Trash(16)} {t.deleteAll}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Version */}
          <div style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:800,fontSize:Math.round(16*fs),display:"flex",alignItems:"center",gap:6}}>{Ic.Tag(16)} {t.version} {APP_VERSION}</div>
                <div style={{fontSize:Math.round(13*fs),color:"#6b7280",marginTop:3}}>{t.updatedAt} {BUILD_DATE}</div>
                <div style={{fontSize:Math.round(11*fs),color:"#9ca3af",marginTop:2}}>{lang==="EN"?"Tap version in header 5x = Admin":"แตะ version ที่ header 5 ครั้ง = Admin"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ TAB BAR ══════════════════ */}
      <div style={S.tabBar}>
        {[
          {id:"patients", icon:Ic.Users, label:t.patients},
          {id:"record",   icon:Ic.Plus,  label:t.record},
          {id:"history",  icon:Ic.List,  label:t.history},
          {id:"report",   icon:Ic.Camera,label:t.report},
          {id:"settings", icon:Ic.Gear,  label:t.settings},
        ].map(tt=>(
          <button key={tt.id} onClick={()=>setTab(tt.id)} style={S.tabItem(tab===tt.id)}>
            <span style={{color:tab===tt.id?"#059669":"#9ca3af"}}>{tt.icon(Math.round(22*fs))}</span>
            {tt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
