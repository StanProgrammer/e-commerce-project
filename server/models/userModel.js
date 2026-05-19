const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    passwordChangedAt: { type: Date, default: undefined },
    role:{ type: String, enum: ['user', 'admin'], default: 'user' },
    profilePic:{ type: String, default: '' },
    bio:{ type: String, maxlength: 500, default: '' },
    profession:{ type: String, maxlength: 100, default: '' },
    passwordResetToken: { type: String, default: undefined },
    passwordResetExpires: { type: Date, default: undefined },
    isDeleted: { type: Boolean, default: false }
},
{ timestamps: true }
)

const User = mongoose.model('User', userSchema);

module.exports = User;
