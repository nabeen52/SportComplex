const mongoose = require('mongoose');
const ImgNewsSchema = new mongoose.Schema({
    // img: { type: String, required: true },
    img_url: { type: String }, // path แบบ '/uploads/news/xxxx.jpg'
});
module.exports = mongoose.model('ImgNews', ImgNewsSchema, 'img_news');