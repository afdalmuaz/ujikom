const mongoose = require('mongoose');
const db = require('../config/db');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;
const userSchema = new Schema ({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
});

module.exports = mongoose.model('user', userSchema);