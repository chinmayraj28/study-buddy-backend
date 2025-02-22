const { Schema, model } = require("mongoose");

const StickyNotesSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    color: { type: String, default: "#F7F684" },
    pinned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = model("StickyNotes", StickyNotesSchema);