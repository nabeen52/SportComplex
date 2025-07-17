const mongoose = require('mongoose');
const cartSchema = new mongoose.Schema({
    user_id: String, // รหัสผู้ใช้
    name: String,    // ชื่ออุปกรณ์
    quantity: Number,
    image: String   // <<<<< ต้องมี image
});
module.exports = mongoose.model('Cart', cartSchema, 'cart');