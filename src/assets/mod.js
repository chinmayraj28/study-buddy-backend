const userInput = {
    subjects: [
        { subject: 'Chemistry', examDate: '04-03-2025', confidenceLevel: 5 },
        { subject: 'Computer Science', examDate: '13-03-2025', confidenceLevel: 7 },
        { subject: 'Math', examDate: '02-03-2025', confidenceLevel: 8 },
        { subject: 'Physics', examDate: '06-03-2025', confidenceLevel: 6 },
        { subject: 'Biology', examDate: '07-03-2025', confidenceLevel: 4 }
    ],
    availableStudyHours: 5, // Hours available per day
    maxContinuousStudyTime: 90, // Max minutes before a break
    minContinuousStudyTime: 30, // Min minutes before a break
    maxSubjectsPerDay: 3 // Max number of subjects to study per day
};

const generateStudyPlan = async (userInput) => {
    const { subjects, availableStudyHours, maxContinuousStudyTime, maxSubjectsPerDay } = userInput;

    // Sort subjects by exam date
    subjects.sort((a, b) => {
        return new Date(a.examDate.split('-').reverse().join('-')) - new Date(b.examDate.split('-').reverse().join('-'));
    });

    const firstExamDate = new Date(subjects[0].examDate.split('-').reverse().join('-'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    firstExamDate.setHours(0, 0, 0, 0);

    const diffInDays = Math.ceil((firstExamDate - today) / (1000 * 60 * 60 * 24));

    subjects.forEach(subject => {
        subject.examTimestamp = new Date(subject.examDate.split('-').reverse().join('-')).getTime();
        subject.studyDays = Math.max(0, Math.floor((subject.examTimestamp - today) / (1000 * 60 * 60 * 24)));
    });

    // Dynamic priority calculation
    const maxConfidence = Math.max(...subjects.map(s => s.confidenceLevel));
    subjects.forEach(subject => {
        subject.priority = (maxConfidence - subject.confidenceLevel + 1) / (subject.studyDays + 1);
    });

    const totalPriority = subjects.reduce((sum, s) => sum + s.priority, 0);
    subjects.forEach(subject => subject.studyWeight = subject.priority / totalPriority);

    const schedule = [];

    for (let dayOffset = 0; dayOffset < diffInDays; dayOffset++) {
        let remainingMinutes = availableStudyHours * 60;
        let dailyPlan = { day: new Date(today.getTime() + dayOffset * 86400000).toDateString(), sessions: [] };

        let subjectAllocations = [];

        subjects
            .filter(subject => dayOffset < subject.studyDays) // Only include subjects that need to be studied
            .sort((a, b) => b.priority - a.priority) // Sort by priority
            .slice(0, maxSubjectsPerDay) // Limit number of subjects per day
            .forEach(subject => {
                let studyTime = Math.floor(subject.studyWeight * availableStudyHours * 60);
                studyTime = Math.min(studyTime, remainingMinutes, maxContinuousStudyTime);
                if (studyTime > 0) {
                    subjectAllocations.push({ subject: subject.subject, duration: studyTime });
                    remainingMinutes -= studyTime;
                }
            });

        dailyPlan.sessions = subjectAllocations;
        schedule.push(dailyPlan);
    }

    return schedule;
};


generateStudyPlan(userInput).then(schedule => console.log(schedule));
// generateStudyPlan(userInput)

