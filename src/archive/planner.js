const express = require("express");
const router = express.Router();

const generateStudyPlan = async (userInput) => {
    const { subjects, availableStudyHours, maxContinuousStudyTime, maxSubjectsPerDay } = userInput;

    subjects.sort((a, b) => {
        return new Date(a.examDate.split('-').reverse().join('-')) - new Date(b.examDate.split('-').reverse().join('-'));
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    subjects.forEach(subject => {
        subject.examTimestamp = new Date(subject.examDate.split('-').reverse().join('-')).getTime();
        subject.studyDays = Math.max(1, Math.floor((subject.examTimestamp - today) / (1000 * 60 * 60 * 24)));
    });

    const totalDays = Math.max(...subjects.map(s => s.studyDays));
    const maxConfidence = Math.max(...subjects.map(s => s.confidenceLevel));
    
    subjects.forEach(subject => {
        subject.priority = (maxConfidence - subject.confidenceLevel + 1) / (subject.studyDays + 1);
    });

    const totalPriority = subjects.reduce((sum, s) => sum + s.priority, 0);
    subjects.forEach(subject => subject.studyWeight = subject.priority / totalPriority);

    const schedule = [];

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
        let remainingMinutes = availableStudyHours * 60;
        let dailyPlan = { day: new Date(today.getTime() + dayOffset * 86400000).toDateString(), sessions: [] };
        let subjectsToday = new Set();
        let availableSubjects = subjects.filter(subject => subject.studyDays > dayOffset);
        
        availableSubjects.sort((a, b) => b.priority - a.priority);
        
        for (let i = 0; i < availableSubjects.length && subjectsToday.size < maxSubjectsPerDay && remainingMinutes > 0; i++) {
            let subject = availableSubjects[i];
            let studyTime = Math.min(Math.floor(subject.studyWeight * availableStudyHours * 60), remainingMinutes, maxContinuousStudyTime);
            
            if (studyTime > 0) {
                dailyPlan.sessions.push({ subject: subject.subject, duration: studyTime });
                remainingMinutes -= studyTime;
                subjectsToday.add(subject.subject);
            }
        }
        
        schedule.push(dailyPlan);
    }

    return schedule;
};


router.post("/", async (req, res) => {
    try {
        const schedule = await generateStudyPlan(req.body);
        console.log(schedule)
        res.json({ schedule });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
