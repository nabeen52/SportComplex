const mongoose = require('mongoose');
const zoneSchema = new mongoose.Schema({
    name: String,
    image: String,
    status: String,
    active: Boolean
});
const fieldSchema = new mongoose.Schema({
    name: String,
    image: String,
    visible: Boolean,
    hasZone: Boolean,
    zones: [zoneSchema]
});
module.exports = mongoose.model('Field', fieldSchema);