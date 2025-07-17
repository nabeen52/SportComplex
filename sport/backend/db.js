// db.js
const mongoose = require('mongoose');

let isConnected = false; // <-- เพิ่มตัวแปรนี้

const connectDB = async () => {
    if (isConnected) return;   // <-- ป้องกันเรียกซ้ำ
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        isConnected = true;
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
};

module.exports = connectDB;
