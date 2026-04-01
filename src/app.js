const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials:true
}))
/* require all the routes here*/
const authRouter = require("./routes/auth.routes.js");
const interviewRouter = require("./routes/interview.routes.js");

/* Using all routes here*/
app.use("/api/auth",authRouter);
app.use("/api/interview",interviewRouter);

module.exports = app;