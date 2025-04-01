const express = require("express");
const router = express.Router();
const User = require("../models/users");
const multer = require("multer");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});
const upload = multer({ storage }).single("image");

// Route: Render "Add User" Page
router.get("/add", (req, res) => {
    res.render("add_users", { title: "User Page" });
});

// Route: Add User to Database
router.post("/add", upload, async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file ? req.file.filename : "", // Prevent crash if no file uploaded
        });

        await user.save();
        req.session.message = { type: "success", message: "User added successfully" };
        res.redirect("/");
    } catch (err) {
        console.error(err);
        req.session.message = { type: "danger", message: "Failed to add user" };
        res.status(500).redirect("/");
    }
});

// Route: Render Home Page with Users List
router.get("/", async (req, res) => {
    try {
        const users = await User.find().exec(); // Fetch users from database
        const message = req.session.message;
        delete req.session.message; // Remove message after displaying it

        res.render("index", { title: "Home Page", users, message });
    } catch (err) {
        console.error(err);
        req.session.message = { type: "danger", message: "Failed to fetch users" };
        res.redirect("/");
    }
});

// Route: Delete User
router.get("/delete/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findByIdAndDelete(id).exec();

        if (user && user.image) {
            try {
                fs.unlinkSync(`./uploads/${user.image}`);
                console.log("Image deleted:", user.image);
            } catch (err) {
                console.error("Error deleting image:", err);
            }
        }

        req.session.message = { type: "danger", message: "User deleted successfully" };
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Route: Render Edit User Page
router.get("/edit/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).exec();
        if (!user) return res.redirect("/");

        res.render("edit_users", { title: "Edit User", user });
    } catch (err) {
        console.error(err);
        res.redirect("/");
    }
});

// Route: Update User
router.post("/update/:id", upload, async (req, res) => {
    const id = req.params.id;
    const newImage = req.file ? req.file.filename : req.body.old_image;

    try {
        const updatedUser = await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: newImage,
        }, { new: true });

        if (!updatedUser) throw new Error("User not found");

        // Remove old image if a new one was uploaded
        if (req.file && req.body.old_image) {
            try { fs.unlinkSync(`./uploads/${req.body.old_image}`); } catch (err) { console.error("Error deleting old image:", err); }
        }

        req.session.message = { type: "success", message: "User updated successfully" };
        res.redirect("/");
    } catch (err) {
        console.error(err);
        req.session.message = { type: "danger", message: err.message };
        res.redirect("/");
    }
});

module.exports = router;