const mongoose = require('mongoose');

mongoose.connect('mongodb://root:password@mongo:27017/SportComplex?authSource=admin')

const userSchema = new mongoose.Schema({
    user_id: String,
    name: String,
    thaiName: { type: String, default: '' },
    email: String,
    role: String,
    photo: String,
    picture: String,
    signaturePath: String,   // path ไฟล์ลายเซ็น
    phone: String,            // ✅ ใหม่: เบอร์โทร
    thaiPrefix: {
        type: String,
        enum: ['นาย', 'นาง', 'นางสาว', ''],
        default: ''
    },

});

module.exports = mongoose.model('User', userSchema);