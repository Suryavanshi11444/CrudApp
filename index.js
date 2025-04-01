require("dotenv").config();
console.log("MONGO_URI:", process.env.DB_URI); // Debugging

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session Configuration
app.use(
    session({
        secret: "complex-secret-key",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Set `true` if using HTTPS
    })
);

// Database Connection
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((error) => console.error("❌ MongoDB Connection Error:", error));

// Set View Engine
app.set("view engine", "ejs");

// Routes
const routes = require("./routes/routes");
app.use("/", routes);

// Static Folder for Uploaded Images
app.use(express.static("uploads"));

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err.stack);
    res.status(500).send("Internal Server Error");
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
