const mongoose = require('mongoose');
const equipmentSchema = new mongoose.Schema({
    name: String,
    image: String,
    quantity: Number,
    visible: { type: Boolean, default: true },
});
module.exports = mongoose.model('EquipmentNEW', equipmentSchema, 'equipments');