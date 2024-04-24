const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    fotoid: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' }, // Menyimpan ID foto yang dilike
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Menyimpan ID pengguna yang melakukan like
}, { collection: 'likefotos' });

const LikeFoto = mongoose.model('LikeFoto', likeSchema);

module.exports = LikeFoto;
