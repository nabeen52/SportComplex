const mongoose = require('mongoose');

const uploadFileSchema = new mongoose.Schema({
    fileName: String,
    fileData: String,  // base64 string
    uploadedAt: { type: Date, default: Date.now },
    user_id: String,   // ถ้าต้องการผูกกับ user
});
module.exports = mongoose.model('UploadFile', uploadFileSchema, 'upload_files');