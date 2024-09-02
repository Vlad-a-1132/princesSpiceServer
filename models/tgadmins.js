const mongoose = require('mongoose');

const tgAdminSchema = mongoose.Schema({
    telegramUserId: {
        type: String,
        required: true
    }
})

exports.TgAdmin = mongoose.model('tgadmins', tgAdminSchema);
exports.tgAdminSchema = tgAdminSchema;

