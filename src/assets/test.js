const Tesseract = require("tesseract.js");
const OpenAI = require("openai");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const openai = new OpenAI({
    apiKey: "sk-svcacct-Xwr16tcthWOtyEV2xNe2uiKSO6ujvyKcF4YSiG5jqTGBZflDg5KUddPJgpzW5EvR-3JLcKdT3BlbkFJzQkSL-zXrzjYcI16hKYVh-ZiIzChbzl3H9x14b91gNQAw9dHgMV_BdKg_5weGB0jCx-WtAA"
});

const userInput = {
    subjects: [
        { name: "Chemistry", confidenceLevel: 5 },
        { name: "Computer Science", confidenceLevel: 7 },
        { name: "Math", confidenceLevel: 8 },
        { name: "Physics", confidenceLevel: 6 },
        { name: "Biology", confidenceLevel: 4 }
    ],
    availableStudyHours: 5, // Hours available per day
    maxContinuousStudyTime: 90, // Max minutes before a break
    minContinuousStudyTime: 30, // Min minutes before a break
    maxSubjectsPerDay: 3 // Max number of subjects to study per day
};

const processExamTimetable = async (text, retries = 3) => {
    try {
        for (let attempt = 1; attempt <= retries; attempt++) {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { 
                        role: "system", 
                        content: `You are an AI that processes exam timetables.
                        - Extract subjects and exam dates per subject.
                        - If the user specifies a list of subjects, return ONLY those subjects, otherwise return ALL subjects.
                        - Return a structured JSON so I can process it. Make sure the data is uniformed.
                        - In the structured JSON file, I want to see ONLY the subject name and exam date. NOTHING else, no extra information.
                        - VERY IMPORTANT: MAKE SURE THE RESPONSES ARE UNIFORMED. THE VARIABLE NAMES SHOULD BE THE SAME FOR ALL SUBJECTS. THE JSON FIELDS MUST BE "subject", "examDate" and respective "confidenceLevel". AND THESE SUBJECTS MUST BE UNDER THE "subjects" ARRAY.
                        - Example: {"subjects": [{"subject": "subject1", "examDate": "date1", "confidenceLevel":9}, {"subject": "subject2", "examDate": "date2", "confidenceLevel":5}]}` 
                    },
                    { 
                        role: "user", 
                        content: `Here is the extracted timetable:\n"${text}"\n\nSubjects: ${JSON.stringify(userInput.subjects)}`
                    }
                ]
            });

            const aiResponse = response.choices[0].message.content.trim();

            try {
                const structuredData = JSON.parse(aiResponse);
                structuredData.otherSettings = {
                    availableStudyHours: userInput.availableStudyHours,
                    maxContinuousStudyTime: userInput.maxContinuousStudyTime,
                    maxSubjectsPerDay: userInput.maxSubjectsPerDay
                }
                
                if (!structuredData || !Array.isArray(structuredData.subjects)) {
                    throw new Error("Invalid JSON format");
                }

                return structuredData; 
            } catch (parseError) {
                console.error(`⚠️ Attempt ${attempt} - OpenAI returned an invalid format. Retrying...`);
                
                if (attempt === retries) {
                    console.error("❌ OpenAI failed to return a valid JSON after multiple attempts.");
                    return null;
                }
            }
        }
    } catch (error) {
        console.error("❌ Error processing exam timetable with OpenAI:", error);
        return null;
    }
};


const extractTextFromImage = async (imagePath) => {
    try {
        const { data: { text } } = await Tesseract.recognize(imagePath, "eng");
        return await processExamTimetable(text);
    } catch (err) {
        console.error("Error extracting text from image:", err);
    }
};

const extractTextFromPDF = async (pdfPath) => {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        return await processExamTimetable(data.text);
    } catch (err) {
        console.error("Error extracting text from PDF:", err);
    }
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

const processFile = async (filePath) => {
    let data = null
    if (filePath.endsWith(".pdf")) {
        data = await extractTextFromPDF(filePath);
    } else if (filePath.endsWith(".jpg") || filePath.endsWith(".png")) {
        data = await extractTextFromImage(filePath);
    } else {
        console.error("Unsupported file type. Please provide a PDF or an image.");
    }
    
    if(data === null){
        console.log("Error while processing the file. Please upload a more clear format.");
    }else{
        // console.log(data);
        const schedule = await generateStudyPlan(data);
        console.log(schedule);
    }
};

const filePath = "timetable.jpg";
processFile(filePath);