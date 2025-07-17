const mongoose = require('mongoose');
const ImgNewsSchema = new mongoose.Schema({
    img: { type: String, required: true }
});
module.exports = mongoose.model('ImgNews', ImgNewsSchema, 'img_news');