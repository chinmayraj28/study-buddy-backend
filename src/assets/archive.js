const userInput = {
    subjects: [
        { subject: 'Chemistry', examDate: '04.01.2025', confidenceLevel: 5 },
        { subject: 'Computer Science', examDate: '13.01.2025', confidenceLevel: 7 },
        { subject: 'Math', examDate: '02.01.2025', confidenceLevel: 8 },
        { subject: 'Physics', examDate: '06.01.2025', confidenceLevel: 6 },
        { subject: 'Biology', examDate: '07.01.2025', confidenceLevel: 4 }
    ],
    availableStudyHours: 5, // Hours available per day
    studyPreference: "focused", // "balanced" | "focused" | "exam-driven"
    maxContinuousStudyTime: 90, // Max minutes before a break
    revisionDays: 2 // Days reserved for revision before each exam
};

const generateStudyPlan = async (userInput) => {
    const { subjects, availableStudyHours, studyPreference, maxContinuousStudyTime, revisionDays } = userInput;
    
    const availableStudyMinutes = availableStudyHours * 60;
    
    subjects.forEach(subject => subject.examTimestamp = new Date(subject.examDate.split(".").reverse().join("-")).getTime());
    subjects.sort((a, b) => a.examTimestamp - b.examTimestamp);
    
    const today = new Date().getTime();
    subjects.forEach(subject => {
        const daysUntilExam = Math.floor((subject.examTimestamp - today) / (1000 * 60 * 60 * 24));
        subject.studyDays = Math.max(0, daysUntilExam - revisionDays);
    });
    
    subjects.forEach(subject => {
        subject.priority = (10 - subject.confidenceLevel) * (1 / (subject.studyDays + 1));
    });
    
    const totalPriority = subjects.reduce((sum, s) => sum + s.priority, 0);
    subjects.forEach(subject => subject.studyWeight = subject.priority / totalPriority);
    
    const schedule = [];
    for (let dayOffset = 0; dayOffset < Math.max(...subjects.map(s => s.studyDays)); dayOffset++) {
        let remainingMinutes = availableStudyMinutes;
        let dailyPlan = { day: new Date(today + dayOffset * 86400000).toDateString(), sessions: [] };
        
        subjects.forEach(subject => {
            if (dayOffset < subject.studyDays) {
                let studyTime = Math.floor(subject.studyWeight * availableStudyMinutes);
                studyTime = Math.min(studyTime, remainingMinutes, maxContinuousStudyTime);
                if (studyTime > 0) {
                    dailyPlan.sessions.push({ subject: subject.subject, duration: studyTime });
                    remainingMinutes -= studyTime;
                }
            }
        });
        
        schedule.push(dailyPlan);
    }
    
    subjects.forEach(subject => {
        for (let i = 0; i < revisionDays; i++) {
            let revisionDate = new Date(subject.examTimestamp - (i + 1) * 86400000).toDateString();
            let revisionEntry = schedule.find(day => day.day === revisionDate);
            if (revisionEntry) {
                revisionEntry.sessions.push({ subject: subject.subject, duration: availableStudyMinutes });
            } else {
                schedule.push({ day: revisionDate, sessions: [{ subject: subject.subject, duration: availableStudyMinutes }] });
            }
        }
    });
    
    schedule.sort((a, b) => new Date(a.day) - new Date(b.day));
    
    return schedule;
};

generateStudyPlan(userInput).then(schedule => console.log(schedule));


