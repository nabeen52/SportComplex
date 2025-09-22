const mongoose = require('mongoose');

// ✅ ชุด role ที่ต้องอนุมัติตามชนิดเอกสาร
const ROLE_SETS = {
    field: ['admin', 'super'],
    equipment: ['admin', 'staff'],
};

// ✅ sub-schema ของ step (ให้ role เป็นตัวพิมพ์เล็ก, trim)
const StepSchema = new mongoose.Schema({
    role: { type: String, required: true, lowercase: true, trim: true },
    approve: { type: Boolean, default: null }, // true/false/null
}, { _id: false });

const historySchema = new mongoose.Schema({
    user_id: String,
    name: String,                  // building
    zone: { type: String, default: "-" },
    name_active: String,           // name_activity
    type: String,                  // 'field' | 'equipment'
    status: String,                // approved, pending, returned, ...

    since: { type: Date },
    uptodate: { type: Date },
    date: { type: Date },
    startTime: String,
    endTime: String,
    quantity: Number,

    approvedBy: String,
    approvedAt: Date,
    disapprovedBy: String,
    approvedById: String,
    disapprovedById: String,
    returnedBy: String,
    returnedById: String,
    returnedAt: Date,
    remark: { type: String, default: '' },
    disapprovedAt: Date,

    attachment: [{ type: String }],
    fileName: [{ type: String }],
    fileType: [{ type: String }],

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

    // เก็บ PDF
    bookingPdf: { type: String, default: null },
    bookingPdfUrl: { type: String, default: null },

    // -------- ฟิลด์ที่เพิ่มมาจาก BookingField (optional) --------
    aw: { type: String, default: '' },
    tel: { type: String, default: '' },
    reasons: { type: String, default: '' },

    // สาธารณูปโภค & รายการประกอบอาคาร
    utilityRequest: { type: String, default: '' },   // 'yes' | 'no'
    facilityRequest: { type: String, default: '' },  // 'yes' | 'no'
    turnon_air: { type: String, default: '' },
    turnoff_air: { type: String, default: '' },
    turnon_lights: { type: String, default: '' },
    turnoff_lights: { type: String, default: '' },
    other: { type: String, default: '' },
    amphitheater: { type: String, default: '' },
    need_equipment: { type: String, default: '' },

    // อื่น ๆ จาก BookingField
    participants: { type: String, default: '' },
    requester: { type: String, default: '' },

    // สถานะรับหนังสือ (ถ้ามีการใช้)
    no_receive: { type: String, default: '' },
    date_receive: { type: Date, default: null },
    receiver: { type: String, default: '' },
    restroom: { type: String, default: '' },

    // ไฟล์เดิมที่ Booking อาจมี (เก็บเป็น URL)
    fileUrl: { type: String, default: '' },

    reason_admin: { type: String, default: '' },
    secretary_choice: {
        to_head: { type: Boolean, default: false },
        for_consider: { type: Boolean, default: false },
        other_checked: { type: Boolean, default: false },
    },

    thaiName_admin: { type: String, default: '' },
    signaturePath_admin: { type: String, default: '' },

    // ===== เพิ่มก่อนปิด schema =====
    superApprovedBy: { type: String, default: '' },
    superApprovedById: { type: String, default: '' },
    superApprovedAt: { type: Date, default: null },
    to_vice_supervisor: { type: Boolean, default: false },
    for_consider_supervisor: { type: Boolean, default: false },
    other_checked_supervisor: { type: Boolean, default: false },
    reason_supervisor: { type: String, default: '' },
    thaiName_supervisor: { type: String, default: '' },
    signaturePath_supervisor: { type: String, default: '' },
    approvedAt_supervisor: { type: Date, default: null },

    head_choice_supervisor: {
        to_vice_supervisor: { type: Boolean, default: false },
        for_consider_supervisor: { type: Boolean, default: false },
        other_checked_supervisor: { type: Boolean, default: false },
    },
    handoverById: { type: String, default: '' },
    handoverBy: { type: String, default: '' },
    handoverAt: { type: Date, default: null },
    handoverRemarkSender: { type: String, default: '' },
    handoverRemarkReceiver: { type: String, default: '' },
    handoverReceiverThaiName: { type: String, default: '' },
    handoverReceiverDate: { type: Date },
    condition: { type: String, default: '' },

    // เพิ่มใน historySchema
    receive_date: { type: Date, default: null },
    receive_time: { type: String, default: '' },
    createdAt_old: { type: Date, default: null },

    // ✅ step ใหม่ (inline sub-docs ใช้ StepSchema)
    step: { type: [StepSchema], default: undefined },

}, { timestamps: true });

/* ---------- ✅ STATICS ช่วย normalize/summarize step ---------- */

// roles ที่ต้องใช้ตามชนิด
historySchema.statics.requiredRolesForType = function (type) {
    return ROLE_SETS[type] || ['admin'];
};

// แปลง step ที่รับมาจาก FE → เก็บเฉพาะ role ที่ถูกต้อง และเติม role ที่ขาด
historySchema.statics.normalizeStepForType = function (type, stepArray = []) {
    const required = this.requiredRolesForType(type);
    const map = new Map();
    if (Array.isArray(stepArray)) {
        for (const s of stepArray) {
            const role = String(s?.role || '').toLowerCase().trim();
            if (!required.includes(role)) continue;
            // รองรับข้อมูลเก่าที่อาจส่ง action มา
            const approve = (typeof s?.approve === 'boolean')
                ? s.approve
                : (typeof s?.action === 'boolean' ? s.action : null);
            map.set(role, { role, approve });
        }
    }
    for (const r of required) if (!map.has(r)) map.set(r, { role: r, approve: null });
    return Array.from(map.values());
};

// สรุปสถานะรวมจาก step
historySchema.statics.deriveStatusFromStep = function (stepArray = [], type) {
    const steps = Array.isArray(stepArray) ? stepArray : [];
    if (steps.some(s => s?.approve === false)) return 'disapproved';
    const required = this.requiredRolesForType(type);
    const map = new Map(steps.map(s => [String(s.role).toLowerCase(), s.approve]));
    const allApproved = required.every(r => map.get(r) === true);
    return allApproved ? 'approved' : 'pending';
};

/* ---------- ✅ HOOKS: auto normalize/summarize ---------- */

// ถ้าไม่ได้ส่ง step/status มา ให้ normalize + derive อัตโนมัติ
historySchema.pre('validate', function (next) {
    try {
        this.step = this.constructor.normalizeStepForType(this.type, this.step);
        if (!this.status) {
            this.status = this.constructor.deriveStatusFromStep(this.step, this.type);
        }
        next();
    } catch (e) { next(e); }
});

// ถ้า step ถูกแก้ภายหลัง (ผ่าน routes) ให้ sync status อัตโนมัติ
historySchema.pre('save', function (next) {
    try {
        if (this.isModified('step')) {
            this.status = this.constructor.deriveStatusFromStep(this.step, this.type);
        }
        next();
    } catch (e) { next(e); }
});

/* ---------- ✅ EXPORTS ---------- */
const History = mongoose.model('History', historySchema, 'history');
History.ROLE_SETS = ROLE_SETS; // เผื่อ routes ต้องใช้อ้างอิง
module.exports = History;