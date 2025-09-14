const mongoose = require('mongoose');

mongoose.connect('mongodb://root:password@mongo:27017/SportComplex?authSource=admin')

const userSchema = new mongoose.Schema({
    user_id: String,
    name: String,
    thaiName: String,
    email: String,
    role: String,
    photo: String,
    picture: String,
    signaturePath: String,   // path ไฟล์ลายเซ็น
    phone: String            // ✅ ใหม่: เบอร์โทร
});

module.exports = mongoose.model('User', userSchema);