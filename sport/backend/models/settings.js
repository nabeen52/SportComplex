// models/settings.js
const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },  // เช่น "approval_roles"
    value: { type: [String], default: [] }                // เก็บ array ของ roles
}, { timestamps: true });

module.exports = mongoose.model("Settings", SettingsSchema);