const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    user_id: String,
    name: String,
    zone: { type: String, default: "-" },
    name_active: String,
    type: String,         // 'field' หรือ 'equipment'
    status: String,       // เช่น approved, pending, returned, ...
    since: { type: Date },    // แก้เป็น Date
    uptodate: { type: Date }, // แก้เป็น Date
    date: { type: Date },     // เวลาขอยืม
    startTime: String,    // เฉพาะ field
    endTime: String,      // เฉพาะ field
    quantity: Number,     // เฉพาะ equipment
    approvedBy: String,   // คนกด approve
    approvedAt: Date,     // วัน/เวลาที่อนุมัติ
    disapprovedBy: String,
    approvedById: String,
    disapprovedById: String,
    returnedBy: String,
    returnedById: String,
    returnedAt: Date,     // วัน/เวลาที่รับคืน
    remark: { type: String, default: '' },
    disapprovedAt: Date,
    attachment: [{ type: String }],  // เก็บ base64 หลายไฟล์
    fileName: [{ type: String }],    // ชื่อไฟล์แต่ละไฟล์
    fileType: [{ type: String }],    // ชนิดไฟล์แต่ละไฟล์
    agency: String,
    booking_id: String,
    returnPhoto: { type: String, default: null },
    canceledBy: String,
    canceledById: String,
    canceledAt: Date,
    notified: { type: Boolean, default: false },
    proxyStudentName: { type: String, default: '' },
    proxyStudentId: { type: String, default: '' },
    username_form: { type: String, default: '' },
    id_form: { type: String, default: '' },
    // --- เพิ่ม field นี้สำหรับเก็บ PDF โดยเฉพาะ ---
    bookingPdf: { type: String, default: null }, // <<-- เพิ่มตรงนี้
    bookingPdfUrl: { type: String, default: null },  // URL ไฟล์จริง

}, {
    timestamps: true // <--- **เพิ่มตรงนี้!!**
});

module.exports = mongoose.model('History', historySchema, 'history');