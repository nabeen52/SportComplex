const mongoose = require('mongoose');

// ประกาศ fileSchema ก่อน!
const fileSchema = new mongoose.Schema({
    fileName: String,
    fileData: String,  // base64, Buffer, หรือ url แล้วแต่รูปแบบ
    mimetype: String
});

const bookingFieldSchema = new mongoose.Schema({
    aw: String,
    // date: String,
    date: { type: Date },
    tel: String,
    agency: String,
    name_activity: String,
    reasons: String,
    // since: String,
    // uptodate: String,
    since: { type: Date },
    uptodate: { type: Date },
    since_time: String,
    until_thetime: String,
    participants: String,
    requester: String,
    building: String,
    zone: String,
    need: String,
    needless: String,
    turnon_air: String,
    turnoff_air: String,
    turnon_lights: String,
    turnoff_lights: String,
    other: String,
    amphitheater: String,
    user_id: String,
    fileUrl: String,
    no_receive: String,
    date_receive: Date,
    receiver: String,
    need_equipment: String,

    uploadFiles: [String],
    booking_id: String,
    utilityRequest: { type: String, default: "no" },   // <--- เพิ่ม
    facilityRequest: { type: String, default: "no" },  // <--- เพิ่ม
    proxyStudentName: { type: String, default: '' },
    proxyStudentId: { type: String, default: '' },

});

module.exports = mongoose.model('BookingField', bookingFieldSchema, 'booking_field');