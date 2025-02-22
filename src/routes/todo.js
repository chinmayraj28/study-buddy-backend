const express = require("express");
const TodoList = require("../models/TodoList");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { title, subtasks = [], priority = "Medium", dueDate } = req.body;
        const userId = req.user.id;

        if (!title) {
            return res.status(400).json({ error: "Title is required." });
        }

        const newTodo = new TodoList({ userId, title, subtasks, priority, dueDate });
        await newTodo.save();
        res.status(201).json({ message: "Task created!", todo: newTodo, taskId: newTodo._id });

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/", async (req, res) => {
    try {
        const userId = req.user.id
        const filter = userId ? { userId } : {}; 
        const todos = await TodoList.find(filter).sort({ createdAt: -1 });
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const todo = await TodoList.findById(req.params.id);
        if(req.user.id !== todo.userId.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        if (!todo) return res.status(404).json({ error: "Task not found" });
        res.json(todo);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { title, status, subtask, priority, dueDate } = req.body;
        
        const todo = await TodoList.findById(req.params.id);
        if(req.user.id !== todo.userId.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        if (!todo) return res.status(404).json({ error: "Task not found" });

        if (title) todo.title = title;
        if (status != null) todo.status = status;
        if (subtask) {
            todo.subtasks.push(subtask);
            todo.markModified("subtasks");
        }
        if (priority) todo.priority = priority;
        if (dueDate) todo.dueDate = dueDate;

        await todo.save();
        res.json({ message: "Task updated!", todo });

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.put("/:todoId/subtasks/:subtaskId", async (req, res) => {
    try {
        const { todoId, subtaskId } = req.params;
        const { title, status } = req.body;

        const todo = await TodoList.findById(todoId);
        if (!todo) return res.status(404).json({ error: "Todo not found" });

        if (req.user.id !== todo.userId.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const subtask = todo.subtasks.id(subtaskId);
        if (!subtask) return res.status(404).json({ error: "Subtask not found" });

        if (title) subtask.title = title;
        if (status != null) subtask.status = status;

        todo.markModified("subtasks");
        await todo.save();

        res.json({ message: "Subtask updated!", todo });

    } catch (error) {
        console.error("Error updating subtask:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.delete("/:id", async (req, res) => {
    try {
        const todo = await TodoList.findByIdAndDelete(req.params.id);
        if(req.user.id !== todo.userId.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        if (!todo) return res.status(404).json({ error: "Task not found" });
        res.json({ message: "Task deleted!" });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete("/:todoId/subtasks/:subtaskId", async (req, res) => {
    try {
        const { todoId, subtaskId } = req.params;

        const todo = await TodoList.findById(todoId);
        if (!todo) return res.status(404).json({ error: "Todo not found" });

        if (req.user.id !== todo.userId.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const subtaskIndex = todo.subtasks.findIndex(sub => sub._id.toString() === subtaskId);
        if (subtaskIndex === -1) return res.status(404).json({ error: "Subtask not found" });
        todo.subtasks.splice(subtaskIndex, 1);
        todo.markModified("subtasks");

        await todo.save();

        res.json({ message: "Subtask deleted!", todo });

    } catch (error) {
        console.error("Error deleting subtask:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;