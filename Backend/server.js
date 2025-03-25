const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs"); // For hashing password comparison

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Uploads folder created.");
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadDir));

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/mydatabase", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// Define Storage for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Set uploads directory as the destination
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
    }
});

const upload = multer({ storage });

// Define User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    address: String,
    mobile: String,
    specialty: String,
    practiceLocation: String,
    photo: String, // Store the file path
});

// Create User Model
const User = mongoose.model("users", userSchema);

// API Route to Save User Data (with File Upload)
app.post("/users", upload.single("photo"), async (req, res) => {
    try {
        const { name, email, password, address, mobile, specialty, practiceLocation } = req.body;
        const photo = req.file ? `/uploads/${req.file.filename}` : null;

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword, // Store hashed password
            address,
            mobile,
            specialty,
            practiceLocation,
            photo
        });

        await newUser.save();
        res.status(201).json({ message: "User saved successfully!", user: newUser });
    } catch (err) {
        console.error("Error saving user:", err);
        res.status(500).json({ error: err.message });
    }
});

// API Route for User Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login attempt:", email, password);

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found");
            return res.status(404).json({ message: "User not found" });
        }

        console.log("User found:", user);

        // Compare password (hashed)
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log("Invalid password");
            return res.status(401).json({ message: "Invalid credentials" });
        }

        console.log("Login successful");
        res.status(200).json({ message: "Login successful", user });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
