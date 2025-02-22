const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { createSchedule, getScheduleById, deleteScheduleById, getSchedulesByUser } = require("../services/schedulerService");

router.post("/",
    [
        body('subjects').isArray().withMessage('Subjects must be an array'),
        body('subjects.*.subject').isString().withMessage('Subject name must be a string'),
        body('subjects.*.examDate').isString().matches(/\d{2}-\d{2}-\d{4}/).withMessage('Exam date must be in DD-MM-YYYY format'),
        body('availableStudyHours').isInt({ min: 1 }).withMessage('Available study hours must be a positive integer'),
        body('maxContinuousStudyTime').isInt({ min: 1 }).withMessage('Max continuous study time must be a positive integer'),
        body('maxSubjectsPerDay').isInt({ min: 1 }).withMessage('Max subjects per day must be a positive integer')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const created = await createSchedule(req.body, req.user.id);
            res.json({ schedule: created, message: "Study schedule generated successfully!", id: created._id });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });

router.get("/:id", async (req, res) => {
    try {
        const schedule = await getScheduleById(req.params.id);
       
        if(req.user.id !== schedule.userId.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        
        if (!schedule) {
            return res.status(404).json({ error: "Schedule not found" });
        }
        res.json({ schedule });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const schedule = await getScheduleById(req.params.id);
        if(req.user.id !== schedule.userId.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        await deleteScheduleById(req.params.id);
        res.json({ message: "Schedule deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/", async (req, res) => {
    try {
        const schedules = await getSchedulesByUser(req.user.id);
        
        res.json({ schedules });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
