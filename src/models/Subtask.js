const { Schema } = require("mongoose");

const SubtaskSchema = new Schema({
    title: { type: String, required: true },
    status: { type: Boolean, default: false }
});

module.exports = SubtaskSchema; // ✅ Correct: Export only the schema
