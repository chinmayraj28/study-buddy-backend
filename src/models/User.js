const { Schema, model } = require("mongoose");

const User = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true }, 
    registeredAt: { type: Date, default: null }, 
    password: { type: String, required: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
});

module.exports = model("User", User);
