const Schedule = require("../models/Schedule");

function generateStudySchedule(data) {
    const schedule = {};
    const currentDate = new Date();
    
    // Convert and sort subjects, keeping track of study counts
    const subjects = data.subjects.map(subject => ({
        ...subject,
        examDate: subject.examDate.split('-').reverse().join('-'), // Convert DD-MM-YYYY to YYYY-MM-DD
        studyCount: 0 // Track how many times each subject has been studied
    }));

    // Find the last exam date to continue until all exams are done
    const lastExamDate = new Date(Math.max(...subjects.map(s => new Date(s.examDate))));

    // Generate schedule until last exam
    while (currentDate <= lastExamDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        let dailySchedule = [];

        // Calculate subject priorities for today
        const subjectPriorities = subjects
            .filter(subject => new Date(subject.examDate) > currentDate)
            .map(subject => {
                const daysUntilExam = Math.max(1, Math.ceil(
                    (new Date(subject.examDate) - currentDate) / (1000 * 60 * 60 * 24)
                ));

                // Modified priority score that considers study count
                const priorityScore = (
                    (10 - subject.confidenceLevel) * // Lower confidence = higher priority
                    (1 / daysUntilExam) * // Closer exam = higher priority
                    (1 + (1 / (subject.studyCount + 1))) // Less studied = higher priority
                );

                return {
                    ...subject,
                    daysUntilExam,
                    priorityScore
                };
            });

        // Sort by priority and take top N subjects
        subjectPriorities.sort((a, b) => b.priorityScore - a.priorityScore);

        // Ensure we're studying subjects that haven't been studied much
        let todaySubjects = [];
        const minStudyCount = Math.min(...subjectPriorities.map(s => s.studyCount));

        // First, try to include subjects with minimum study count
        const leastStudied = subjectPriorities.filter(s => s.studyCount === minStudyCount);
        todaySubjects = leastStudied.slice(0, data.maxSubjectsPerDay);

        // If we still have slots, fill with highest priority subjects
        if (todaySubjects.length < data.maxSubjectsPerDay) {
            const remaining = subjectPriorities
                .filter(s => !todaySubjects.find(ts => ts.subject === s.subject))
                .slice(0, data.maxSubjectsPerDay - todaySubjects.length);
            todaySubjects = [...todaySubjects, ...remaining];
        }

        if (todaySubjects.length > 0) {
            const totalPriorityScore = todaySubjects.reduce((sum, s) => sum + s.priorityScore, 0);
            const totalMinutes = data.availableStudyHours * 60;
            let remainingMinutes = totalMinutes;

            todaySubjects.forEach(subject => {
                const allocatedMinutes = Math.min(
                    Math.floor((subject.priorityScore / totalPriorityScore) * totalMinutes),
                    data.maxContinuousStudyTime,
                    remainingMinutes
                );

                if (allocatedMinutes > 0) {
                    dailySchedule.push({
                        subject: subject.subject,
                        minutes: allocatedMinutes,
                        daysUntilExam: subject.daysUntilExam,
                        priorityScore: subject.priorityScore.toFixed(2)
                    });

                    // Update study count for the subject
                    const subjectIndex = subjects.findIndex(s => s.subject === subject.subject);
                    subjects[subjectIndex].studyCount++;

                    remainingMinutes -= allocatedMinutes;
                }
            });
        }

        schedule[dateStr] = dailySchedule;
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return schedule;
}

async function createSchedule(data, userId) {
    const schedule = generateStudySchedule(data);
    const createdSchedule = await Schedule.create({
        subjects: data.subjects,
        userId: userId,
        scheduleName: data.scheduleName,
        schedule: schedule,
        availableStudyHours: data.availableStudyHours,
        maxContinuousStudyTime: data.maxContinuousStudyTime,
        minContinuousStudyTime: data.minContinuousStudyTime,
        maxSubjectsPerDay: data.maxSubjectsPerDay
    });
    return createdSchedule;
}

async function getScheduleById(scheduleId) {
    const schedule = await Schedule.findById(scheduleId);
    return schedule;
}

async function deleteScheduleById(scheduleId) {
    await Schedule.findByIdAndDelete(scheduleId);
}

async function getSchedulesByUser(userId) {
    const schedules = await Schedule.find({ userId });
    return schedules;
}

module.exports = { generateStudySchedule, createSchedule, getScheduleById, deleteScheduleById, getSchedulesByUser };
