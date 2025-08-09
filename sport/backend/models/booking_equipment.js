const mongoose = require('mongoose');

const bookingEquipmentSchema = new mongoose.Schema({
    items: [
        {
            item_name: String,
            amount: Number,
            remark: String        // <<== เพิ่มตรงนี้
        }
    ],
    name: String,
    booking_id: String,
    user_id: String,
    agency: String,
    number: String,
    reason: String,
    location: String,
    start_date: { type: Date },
    end_date: { type: Date },
    book_no: String,
    receive_date: Date,
    receive_time: String,
    attachedFiles: [    // <<== เพิ่มตรงนี้!
        {
            fileId: String,
            fileName: String,
            mimeType: String,

        }
    ],
    username_form: String,
    id_form: String,
});

module.exports = mongoose.model('BookingEquipment', bookingEquipmentSchema, 'booking_equipment');