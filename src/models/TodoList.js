const { Schema, model } = require("mongoose");
const SubtaskSchema = require("./Subtask"); 

const TodoListSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, 
    title: { type: String, required: true },
    subtasks: { type: [SubtaskSchema], default: [] }, 
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" }, 
    status: { type: Boolean, default: false },    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    sendReminders: { type: Boolean, default: true }
});

TodoListSchema.pre("findOneAndUpdate", function (next) {
    this.set({ updatedAt: Date.now() });
    next();
});

module.exports = model("TodoList", TodoListSchema);
