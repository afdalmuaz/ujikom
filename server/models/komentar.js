// komentarModel.js

const mongoose = require('mongoose');

const komentarSchema = new mongoose.Schema({
  fotoid: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' }, // asumsikan Image adalah model untuk gambar
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // asumsikan User adalah model untuk pengguna
  isiKomentar: String,
  tanggalKomentar: { type: Date, default: Date.now }
});

const Komentar = mongoose.model('Komentar', komentarSchema);

module.exports = Komentar;
