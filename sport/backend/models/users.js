const mongoose = require('mongoose');

mongoose.connect('mongodb://root:password@mongo:27017/SportComplex?authSource=admin')

const userSchema = new mongoose.Schema({
    // username: String,
    // password: String,
    // email: String,

    // role: String,
    // name: String,
    // user_id: String,
    // email: String,

    user_id: String,      // <-- สำคัญ! ต้องมี user_id
    name: String,
    email: String,
    role: String,

    photo: String,        // (optional)
    picture: String       // <- ใช้ 'picture' เหมือน Google
});
module.exports = mongoose.model('User', userSchema);
