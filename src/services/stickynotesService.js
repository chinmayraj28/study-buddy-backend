const stickyNotes = require("../models/StickyNotes");

const createStickyNote = async (data, userId) => {
    const { title, content, color, pinned } = data;
    const stickyNote = new stickyNotes({ userId, title, content, color, pinned });
    return stickyNote.save();
};

const getStickyNoteById = async (id) => {
    return stickyNotes.findById(id);
};

const deleteStickyNoteById = async (id) => {
    return stickyNotes.findByIdAndDelete(id);
};

const getStickyNotesByUser = async (userId) => {
    return stickyNotes.find({ userId });
};

module.exports = { createStickyNote, getStickyNoteById, deleteStickyNoteById, getStickyNotesByUser };