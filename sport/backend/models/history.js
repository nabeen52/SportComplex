const mongoose = require('mongoose');

/* ---------- STEP SUB-SCHEMA ---------- */
const StepSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            enum: ['staff', 'admin', 'super'],
        },
        // ใช้ Mixed เพื่อเก็บ true/false/null ได้จริง โดยไม่ถูก cast
        approve: { type: mongoose.Schema.Types.Mixed, default: null },
        actorName: { type: String, default: '' },
        actedAt: { type: Date, default: null },
    },
    { _id: false, timestamps: false }
);

const historySchema = new mongoose.Schema(
    {
        user_id: String,
        name: String,
        zone: { type: String, default: '-' },
        name_active: String,
        type: String,       // 'field' | 'equipment'
        status: String,     // approved, pending, returned, ...
        since: { type: Date },
        uptodate: { type: Date },
        date: { type: Date },
        startTime: String,
        endTime: String,
        quantity: Number,

        specialAdminQuick: { type: Boolean, default: false }, // ✅ ธงว่าเอกสารถูกสร้างจากปุ่ม "จองพิเศษ (Admin)"
        createdByRole: { type: String, default: '' },         // เช่น 'admin'


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

        bookingPdf: { type: String, default: null },
        bookingPdfUrl: { type: String, default: null },

        // -------- จาก BookingField --------
        aw: { type: String, default: '' },
        tel: { type: String, default: '' },
        reasons: { type: String, default: '' },

        utilityRequest: { type: String, default: '' },   // 'yes' | 'no'
        facilityRequest: { type: String, default: '' },  // 'yes' | 'no'
        turnon_air: { type: String, default: '' },
        turnoff_air: { type: String, default: '' },
        turnon_lights: { type: String, default: '' },
        turnoff_lights: { type: String, default: '' },
        other: { type: String, default: '' },
        amphitheater: { type: String, default: '' },
        need_equipment: { type: String, default: '' },

        participants: { type: String, default: '' },
        requester: { type: String, default: '' },

        no_receive: { type: String, default: '' },
        date_receive: { type: Date, default: null },
        receiver: { type: String, default: '' },
        restroom: { type: String, default: '' },
        room_request: { type: String, default: '' },

        fileUrl: { type: String, default: '' },

        reason_admin: { type: String, default: '' },
        secretary_choice: {
            to_head: { type: Boolean, default: false },
            for_consider: { type: Boolean, default: false },
            other_checked: { type: Boolean, default: false },
        },

        thaiName_admin: { type: String, default: '' },
        signaturePath_admin: { type: String, default: '' },

        // (ฟิลด์เดิมอื่น ๆ คงไว้)
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

        receive_date: { type: Date, default: null },
        receive_time: { type: String, default: '' },
        createdAt_old: { type: Date, default: null },

        // ✅ step – เก็บเท่าที่ FE ส่งมา
        step: { type: [StepSchema], default: [] },
    },
    { strict: true, timestamps: true }
);

/* ---------- Helpers สำหรับสถานะรวม ---------- */
function deriveStatusFromStep(stepArray = []) {
    const steps = Array.isArray(stepArray) ? stepArray : [];
    if (steps.some(s => s?.approve === false)) return 'disapproved';
    if (steps.length > 0 && steps.every(s => s?.approve === true)) return 'approved';
    return 'pending';
}

/* ---------- Hooks ---------- */
historySchema.pre('validate', function (next) {
    try {
        if (Array.isArray(this.step)) {
            const uniq = new Map();
            for (const s of this.step) {
                const role = String(s?.role || '').trim().toLowerCase();
                if (!role || !['staff', 'admin', 'super'].includes(role)) continue;
                const approve =
                    s?.approve === true ? true :
                        s?.approve === false ? false :
                            null;
                if (!uniq.has(role)) uniq.set(role, { role, approve, actorName: s?.actorName || '', actedAt: s?.actedAt || null });
            }
            this.step = Array.from(uniq.values());
        } else {
            this.step = [];
        }

        if (!this.status) this.status = deriveStatusFromStep(this.step);
        next();
    } catch (e) { next(e); }
});

historySchema.pre('save', function (next) {
    try {
        if (this.isModified('step')) {
            this.status = deriveStatusFromStep(this.step);
        }
        next();
    } catch (e) { next(e); }
});

historySchema.index({ booking_id: 1, type: 1, status: 1 });

module.exports = mongoose.model('History', historySchema, 'history');