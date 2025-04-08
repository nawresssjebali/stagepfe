const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto"); // For generating secure tokens

const app = express();

// Middleware
const corsOptions = {
  origin: 'http://localhost:4200', // Allow Angular frontend to access the backend
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
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
  .catch(err => console.error("MongoDB connection error:", err));

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
  resetPasswordToken: String, // Token for password reset
  resetPasswordExpires: Date, // Expiration date for reset token
});

// Create User Model
const User = mongoose.model("users", userSchema);

// API Route to Save User Data (with File Upload)
app.post("/users", upload.single("photo"), async (req, res) => {
  try {
    console.log("Received user data:", req.body); // Log received user data
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
    console.log("User saved successfully:", newUser);
    res.status(201).json({ message: "User saved successfully!", user: newUser });
  } catch (err) {
    console.error("Error saving user:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API Route for User Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt with email:", email); // Log login attempt

<<<<<<< HEAD
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

        // Send the user object including the specialty
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                address: user.address,
                mobile: user.mobile,
                specialty: user.specialty, // Send specialty
                practiceLocation: user.practiceLocation,
                photo: user.photo,
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: err.message });
=======
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ success: false, message: "User not found" });
>>>>>>> 8243676 (interface medecin general version 1)
    }

    // Compare password (hashed)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    console.log("Login successful for user:", email);

    // Send the user object including the specialty
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        mobile: user.mobile,
        specialty: user.specialty, // Send specialty
        practiceLocation: user.practiceLocation,
        photo: user.photo,
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API Route to Send Password Reset Link (Email)
app.post("/send-email", async (req, res) => {
  const { email } = req.body;
  console.log("Received request to send email for:", email); // Log the email request

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Create the reset URL
    const resetUrl = `http://localhost:4200/reset-password/${resetToken}`;

    // Set up email transporter using nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'nawressjebalinounou@gmail.com', // Use your email
        pass: 'nspb qesr oral zttl', // Use App Password or OAuth2
      }
    });

    const mailOptions = {
      from: 'nawressjebalinounou@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      text: `Hello ${user.name},\n\nYou requested a password reset. Please click the link below to reset your password:\n\n${resetUrl}\n\nThe link will expire in 1 hour.\n\nRegards,\nYour Team`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);

    return res.status(200).json({ success: true, message: 'Password reset link sent successfully!' });
  } catch (err) {
    console.error("Error sending email:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// API Route to Reset Password
app.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  console.log("Received password reset request for token:", token); // Log the reset request

  try {
    // Find the user with the matching reset token and check if it's valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Token should be valid and not expired
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Hash the new password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    user.password = hashedPassword;
    user.resetPasswordToken = undefined; // Clear the reset token
    user.resetPasswordExpires = undefined; // Clear the expiry date
    await user.save();

    console.log("Password reset successful for user:", user.email);
    res.status(200).json({ success: true, message: 'Password has been reset successfully!' });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
app.use(express.json());

// Log error endpoint
app.post('/log-error', (req, res) => {
  const { message } = req.body;

  // Path to your error.txt file
  const logFilePath = path.join(__dirname, 'src', 'app', 'reset-password', 'error.txt');
  
  // Create the log message with a timestamp
  const logMessage = `${new Date().toISOString()} - ${message}\n`;

  // Append the log message to the error.txt file
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
      return res.status(500).send('Error logging message');
    }
    res.status(200).send('Error logged successfully');
  });
});
// API Route to get the doctor's photo
app.get("/api/me/photo", async (req, res) => {
  try {
    const userId = req.user.id;  // Get the user ID from the session or JWT token
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    console(user.photo);
    const photoPath = user.photo;
    if (!photoPath) {
      return res.status(404).json({ success: false, message: "Photo not found" });
    }

    // Serve the photo from the 'uploads' folder
    res.sendFile(path.join(__dirname, photoPath));  // Ensure photoPath is correct
  } catch (err) {
    console.error("Error fetching photo:", err);
    res.status(500).json({ success: false, message: "Error fetching photo" });
  }
});




  

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
