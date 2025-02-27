require("dotenv").config();
require("./src/cronJobs/todoListReminder");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./src/services/authMiddleware");
const rateLimit = require("express-rate-limit")

const app = express();

// MongoDB Connection
mongoose.connect(process.env.DB_URI).then(() => console.log('Connected to MongoDB')).catch(err => console.error('MongoDB Connection Error:', err));

app.use(
    cors({
      origin: "https://chinmayraj28.github.io", 
      methods: "GET,POST,PUT,DELETE",
      credentials: true, 
    })
  );
  
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, 
//     max: 100, 
//     message: { error: "Too many requests, please try again later." }
// });
// app.use(limiter);

// Routes
app.use("/v1/register", require("./src/routes/register"));
app.use("/v1/login", require("./src/routes/login"));
app.use("/v1/todo", authMiddleware, require("./src/routes/todo"));
app.use("/v1/planner", authMiddleware, require("./src/routes/schedule"));
app.use("/v1/update", authMiddleware, require("./src/routes/update"));
app.use("/v1/stickynotes", authMiddleware, require("./src/routes/stickynotes"));
app.use("/v1/aichat", authMiddleware, require("./src/routes/aichat"));
app.use("/v1/pass", require("./src/routes/forgot-password"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
