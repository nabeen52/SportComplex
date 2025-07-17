const mongoose = require('mongoose');
// ถ้ารัน script ใน container ใช้ mongo, ถ้ารันจาก Windows ให้ใช้ localhost
mongoose.connect('mongodb://root:password@localhost:27017/SportComplex?authSource=admin');
// ถ้าเจอ error "ECONNREFUSED" ให้เปลี่ยนเป็น 'mongo' แทน 'localhost' แล้วรันใน docker

const User = require('./models/User');

const testUser = new User({
    email: "test@example.com",
    name: "Test User",
    user_id: "999999",
    role: "user"
});

testUser.save().then(() => {
    console.log('Save test user OK');
    mongoose.disconnect();
}).catch(console.error);
