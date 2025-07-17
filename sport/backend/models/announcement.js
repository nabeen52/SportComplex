const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    announce: {
        type: String,
        required: true,
        default: ""
    }
});

module.exports = mongoose.model('Announcement', announcementSchema, 'announcement');
