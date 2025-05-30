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

// Define CORS options
const corsOptions = {
  origin: "http://localhost:4200", // Allow requests from your frontend domain
  methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific HTTP methods
  allowedHeaders: ["Content-Type", "Authorization", 'senderId', 'receiverId'], // Allow specific headers
};

// Enable CORS for all routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pre-flight request handler for all routes

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
  resetPasswordExpires: Date,
  rating: { type: Number, default: null },  // Expiration date for reset token
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
// API Route for User Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt with email:", email); // Log login attempt

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



app.post('/log-error', (req, res) => {
  const { message } = req.body;

  const logFilePath = path.join(__dirname, 'src', 'app', 'reset-password', 'error.txt');
  const logDir = path.dirname(logFilePath);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logMessage = `${new Date().toISOString()} - ${message}\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('❌ Error writing to log file:', err);
      return res.status(500).send('Error logging message');
    }
    res.status(200).send('✅ Error logged successfully');
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

app.put("/users/:id", upload.single("photo"), async (req, res) => {
  try {
    const userId = req.params.id;

    // Extract updates from req.body
    const updates = { ...req.body };

    // If password is present, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // If a new photo is uploaded, update the photo path
    if (req.file) {
      updates.photo = `/uploads/${req.file.filename}`;
    }

    // Remove empty fields (optional)
    Object.keys(updates).forEach((key) => {
      if (!updates[key]) delete updates[key];
    });

    // Perform the update in MongoDB
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user", error: error.message });
  }
});
app.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log("User deleted successfully:", user);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
// API Route to Get All Doctors Specializing in Cardiology
// Fetch cardiology doctors
app.get("/api/cardiology-doctors", async (req, res) => {
  console.log("Received request to fetch cardiology doctors.");

  try {
    const cardiologyDoctors = await User.find({ specialty: /cardiologie/i });

    if (cardiologyDoctors.length === 0) {
      console.log("No cardiology doctors found.");
      return res.status(404).json({ message: "No cardiology doctors found." });
    }

    console.log(`Found ${cardiologyDoctors.length} cardiology doctors.`);
    res.status(200).json(cardiologyDoctors);
  } catch (err) {
    console.error("Error fetching cardiology doctors:", err);
    res.status(500).json({ message: "Error fetching cardiology doctors." });
  }
});
// Define ECG Schema
const ecgSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  filePath: { type: String, required: true },
  emergencyLevel: { type: String, enum: ['normal', 'urgent', 'critical'], required: true }, // ✅ Add this line
  uploadDate: { type: Date, default: Date.now }
});

// Create ECG Model
const ECG = mongoose.model("ecgs", ecgSchema);

// Define ECG upload directory
const ecgUploadDir = "C:/Users/jebali nawress/stagepfe-main/Backend/ECGS";

if (!fs.existsSync(ecgUploadDir)) {
  fs.mkdirSync(ecgUploadDir, { recursive: true });
  console.log("✅ ECGS folder created at:", ecgUploadDir);
}

const ecgStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ecgUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = 'ecg-' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const ecgUpload = multer({ storage: ecgStorage });

app.post("/upload-ecg", ecgUpload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const senderId = req.headers["senderid"];
    const receiverId = req.headers["receiverid"];
    const emergencyLevel = req.body.emergencyLevel; // ✅ Get emergencyLevel from body

    // ✅ Validation
    if (!file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    if (!senderId || !receiverId || !emergencyLevel) {
      return res.status(400).json({ error: "Missing senderId, receiverId, or emergencyLevel." });
    }

    // ✅ Save to MongoDB
    const ecg = await ECG.create({
      senderId,
      receiverId,
      filePath: file.path,
      emergencyLevel, // ✅ Save emergency level in DB
    });

    // ✅ Respond with success
    res.status(200).json({
      message: "ECG uploaded successfully!",
      filename: file.filename,
      path: file.path,
      senderId,
      receiverId,
      emergencyLevel, // ✅ Return emergencyLevel
    });

  } catch (error) {
    console.error("❌ ECG Upload Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.put('/api/doctors/:id/rate', async (req, res) => {
  const doctorId = req.params.id;
  const { rating } = req.body;

  try {
    // Corrected to use the 'User' model
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).send('Doctor not found');
    }

    // If the 'rating' field does not exist yet, create it (or it can be null initially)
    if (doctor.rating === null) {
      doctor.rating = rating;
    } else {
      // Update the rating as an average if multiple ratings exist
      doctor.rating = (doctor.rating + rating) / 2;
    }

    await doctor.save();
    res.status(200).json({ message: 'Rating updated successfully' });
  } catch (err) {
    console.error('❌ Server error during rating update:', err);
    res.status(500).send('Error updating rating');
  }
});
// Define the Report Schema
const reportSchema = new mongoose.Schema({
  username: { type: String, required: true },
  reportedDoctor: { type: String, required: true },
  reason: { type: String, required: true },
  time: { type: Date, default: Date.now }
});

// Create the Report Model
const Report = mongoose.model("reports", reportSchema);
// API Route to report a doctor
app.post("/api/doctors/:id/report", async (req, res) => {
  const { reason } = req.body; // Get the reason from the request body
  const reportedDoctor = req.params.id; // The reported doctor's ID (passed in the URL)
  const username = req.body.username; // Get the username from the body or localStorage

  if (!reason || !username) {
    return res.status(400).json({ message: "Reason and username are required" });
  }

  try {
    // Create the report object
    const newReport = new Report({
      username,
      reportedDoctor,
      reason,
      time: new Date() // Timestamp of the report
    });

    // Save the report to MongoDB
    await newReport.save();
    res.status(201).json({ message: "Report saved successfully" });
  } catch (err) {
    console.error("Error saving report:", err);
    res.status(500).json({ message: "Error saving the report" });
  }
});

// Event Schema
const eventSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  doctorId: { type: String, required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  roomId: { type: String, required: true }  // <- still required
});


const Event = mongoose.model("events", eventSchema);
const { v4: uuidv4 } = require('uuid');

app.post('/events', async (req, res) => {
  try {
    const { userId, doctorId, title, date } = req.body;

    if (!userId || !doctorId || !title || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const roomId = uuidv4(); // ✅ Generate roomId

    const newEvent = new Event({
      userId,
      doctorId,
      title,
      date: new Date(date),
      roomId // ✅ Now provided
    });

    await newEvent.save();
    console.log('✅ Event saved:', newEvent);

    res.status(201).json({ message: 'Event saved successfully', event: newEvent });

  } catch (err) {
    console.error('❌ Error saving event:', err);
    res.status(500).json({ error: 'Failed to save event' });
  }
});

// Route to create/save a calendar event
app.get('/events', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const events = await Event.find({ userId });

    console.log('Fetched events from the database:', events);

    res.status(200).json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});


const cron = require("node-cron");
// ✅ New Schema (no receiverId)
const broadcastECGSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  filePath: { type: String, required: true },
  emergencyLevel: {
    type: String,
    enum: ['normal', 'urgent', 'critical'],
    required: true
  },
  uploadDate: { type: Date, default: Date.now }
});

// ✅ New model and MongoDB collection name
const BroadcastECG = mongoose.model("broadcastEcgUploads", broadcastECGSchema);

// ✅ Optional: new folder for separation
const broadcastECGUploadDir = "C:/Users/jebali nawress/stagepfe-main/Backend/Broadcast_ECGS";

if (!fs.existsSync(broadcastECGUploadDir)) {
  fs.mkdirSync(broadcastECGUploadDir, { recursive: true });
  console.log("✅ Broadcast ECG folder created at:", broadcastECGUploadDir);
}

const broadcastECGStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, broadcastECGUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = 'broadcast-ecg-' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const broadcastUpload = multer({ storage: broadcastECGStorage });

// ✅ NEW endpoint: /upload-broadcast-ecg
app.post("/upload-ecg-to-all-docctors", broadcastUpload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const senderId = req.headers["senderid"];
    const emergencyLevel = req.body.emergencyLevel;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    if (!senderId || !emergencyLevel) {
      return res.status(400).json({ error: "Missing senderId or emergencyLevel." });
    }

    // ✅ Save to the new collection
    const broadcastECG = await BroadcastECG.create({
      senderId,
      filePath: file.path,
      emergencyLevel
    });

    res.status(200).json({
      message: "Broadcast ECG uploaded successfully.",
      filename: file.filename,
      path: file.path,
      senderId,
      emergencyLevel
    });

  } catch (error) {
    console.error("❌ Broadcast ECG Upload Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
