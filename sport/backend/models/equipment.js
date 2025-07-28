const mongoose = require('mongoose');
const equipmentSchema = new mongoose.Schema({
    name: String,
    image: String,
    quantity: Number,
    visible: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },  // <- เพิ่ม field นี้
    usageByMonthYear: {
        type: [
            {
                year: Number,
                month: Number,
                usage: Number
            }
        ],
        default: []
    }
});
module.exports = mongoose.model('EquipmentNEW', equipmentSchema, 'equipments');