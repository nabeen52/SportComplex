const mongoose = require('mongoose');

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
        to_head: { type: Boolean, default: false }, // ติ๊ก "เรียน หัวหน้าศูนย์กีฬา"
        for_consider: { type: Boolean, default: false }, // ติ๊ก "เพื่อโปรดพิจารณา"
        other_checked: { type: Boolean, default: false }, // ช่อง "อื่นๆ" ถูกติ๊กไหม
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

    handoverById: { type: String, default: '' },          // user_id ผู้ส่งมอบ
    handoverBy: { type: String, default: '' },            // ชื่อผู้ส่งมอบ (ไทย/อังกฤษ)
    handoverAt: { type: Date, default: null },            // เวลา/วันที่ส่งมอบ
    handoverRemarkSender: { type: String, default: '' },  // หมายเหตุช่องซ้าย (ผู้ส่งมอบ)
    handoverRemarkReceiver: { type: String, default: '' },// หมายเหตุช่องขวา (ผู้รับคืน—ถ้าจะใช้)

    handoverReceiverThaiName: { type: String, default: '' }, // ชื่อไทยผู้รับคืน (ช่องขวา)
    handoverReceiverDate: { type: Date },                    // วันที่ผู้รับคืน (ช่องขวา)

    condition: { type: String, default: '' },
},

    {
        timestamps: true
    });



module.exports = mongoose.model('History', historySchema, 'history');