const cron = require("node-cron");
const nodemailer = require("nodemailer");
const TodoList = require("../models/TodoList");
const User = require("../models/User");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});

cron.schedule("0 0 * * *", async () => {
    try {
        const users = await User.find();
        for (const user of users) {
            if (!user.email) continue;

            const pendingTasks = await TodoList.find({
                userId: user._id,
                status: false,
                sendReminders: true
            });

            if (pendingTasks.length === 0) continue;

            const taskList = pendingTasks.map(task => {
                let subtaskList = "";
                if (task.subtasks && task.subtasks.length > 0) {
                    subtaskList = `<ul style='margin-top: 5px;'>${task.subtasks.map(sub => `<li>${sub.title}</li>`).join("")}</ul>`;
                }
                return `<li style='margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;'>
                            <b style='color: #007bff;'><a href=${process.env.CLIENT_URL} style='text-decoration: none; color: #007bff;'>${task.title}</a></b>
                            ${subtaskList}
                        </li>`;
            }).join("");

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: "Hey! Here's a Quick Task Reminder 📌",
                html: `
                    <div style='font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;'>
                        <div style='max-width: 600px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>
                            <h2 style='color: #333;'>Hey ${user.username},</h2>
                            <p style='color: #555; font-size: 16px;'>Just a heads-up! Here are some tasks you still need to tackle:</p>
                            <ul style='list-style: none; padding: 0;'>${taskList}</ul>
                            <hr style='margin: 20px 0;'>
                            <p style='color: #777;'>You've got this! Let me know if you need any help. 🚀 <br> - <b>Study Buddy</b></p>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
        }
    } catch (error) {
        console.error("Error sending reminders:", error);
    }
},
{timezone: "Asia/Kolkata"});