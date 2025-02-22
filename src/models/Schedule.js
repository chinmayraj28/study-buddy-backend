const { Schema, model } = require("mongoose");

const ScheduleSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    scheduleName: { type: String, required: true },
    subjects: [
        { subject: { type: String, required: true }, examDate: { type: String, required: true }, confidenceLevel: { type: Number, required: true } }
    ],
    availableStudyHours: { type: Number, required: true },
    maxContinuousStudyTime: { type: Number, required: true },
    maxSubjectsPerDay: { type: Number, required: true },
    schedule: { type: Object, required: true },
});

module.exports = model("Schedule", ScheduleSchema);