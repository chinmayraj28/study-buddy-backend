const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { createStickyNote, getStickyNoteById, deleteStickyNoteById, getStickyNotesByUser } = require("../services/stickynotesService");

router.post("/",
    [
        body('content').isString().withMessage('Content must be a string')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const created = await createStickyNote(req.body, req.user.id);
            res.json({ stickyNote: created.stickyNote, message: "Sticky note created successfully!", id: created._id });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Internal Server Error" });
        }
});

router.get("/:id", async (req, res) => {
    try {
        const stickyNote = await getStickyNoteById(req.params.id);
        
        if(req.user.id !== stickyNote.userId.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        
        if (!stickyNote) {
            return res.status(404).json({ error: "Sticky note not found" });
        }
        res.json({ stickyNote });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const stickyNote = await getStickyNoteById(req.params.id);
        if(req.user.id !== stickyNote.userId.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        await deleteStickyNoteById(req.params.id);
        res.json({ message: "Sticky note deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/", async (req, res) => {
    try {
        const stickyNotes = await getStickyNotesByUser(req.user.id);
        res.json({ stickyNotes });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
