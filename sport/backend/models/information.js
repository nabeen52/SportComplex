const mongoose = require('mongoose');

const informationSchema = new mongoose.Schema({
    unit: String,
    usage: { type: Number, default: 0 },
    type: String,
    usageByMonthYear: [
        {
            year: Number,
            month: Number,
            usage: { type: Number, default: 1 },
            hours: { type: Number, default: 0 },
            fieldName: { type: String, default: "" },  // ✅ เพิ่มตรงนี้
            participants: { type: Number, default: 0 },
        }
    ]
});

module.exports = mongoose.model('Information', informationSchema, 'information');