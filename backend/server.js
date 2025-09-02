require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const Crane = require("./models/Crane");
const User = require("./models/User");

const craneRoutes = require("./routes/CraneRoutes");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

console.log("Loaded EMAIL_USER from .env:", process.env.EMAIL_USER);
console.log("Loaded DB_URL from .env:", process.env.DB_URL ? "Found" : "Not found");
const app = express();
app.use(cors({ 
  origin: ["https://hunter.sumerudigital.com","http://localhost:3000"], 
  credentials: true 
}));
app.use(express.json());

// Test route to check if server is working
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

// Routes
app.use("/api/cranes", craneRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);

// DB Connection
const DB_URL = process.env.DB_URL || "mongodb://127.0.0.1:27017/crane_inspection";
console.log("Connecting to MongoDB...");

mongoose
  .connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log("🌐 Database:", mongoose.connection.name);
    console.log("🔗 Connection URL:", DB_URL.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    console.error("🔧 Please check your DB_URL in .env file");
    console.error("📝 Make sure your MongoDB Atlas cluster is accessible");
    process.exit(1); // Exit if database connection fails
  });

// MongoDB connection event listeners
mongoose.connection.on('connected', () => {
  console.log('🎉 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 MongoDB connection closed through app termination');
  process.exit(0);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start auto-email service after server starts
  try {
    const { startAutoEmailService } = require('./services/autoEmailService');
    startAutoEmailService();
  } catch (error) {
    console.error('❌ Failed to start auto-email service:', error);
  }
});

/* ------------------ AUTO EMAIL ALERTS ------------------ */
// Email transporter with enhanced Gmail configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  secure: true,
  port: 465,
  tls: {
    rejectUnauthorized: false
  }
});

// Verify email configuration on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error("❌ Email configuration error:", error);
    console.error("🔧 Please check your Gmail credentials in .env file");
    console.error("📧 Make sure to use Gmail App Password, not regular password");
  } else {
    console.log("✅ Email configuration verified successfully");
    console.log("📧 Email service ready to send alerts");
  }
});

// Function to send email alerts
const sendCraneEmailAlert = async (crane, recipientEmail, alertType) => {
  try {
    let subject, text;
    
    if (alertType === 'near-expire') {
      subject = `⚠️ CRANE EXPIRATION WARNING - ${crane["Unit #"]} - 4 DAYS REMAINING`;
      text = `
Dear Supervisor,

⚠️ URGENT WARNING: Your crane will expire in 4 days!

CRANE DETAILS:
• Unit #: ${crane["Unit #"]}
• Make & Model: ${crane["Make and Model"]}
• Serial #: ${crane["Serial #"]}
• Year: ${crane["Year"] || "N/A"}
• Ton: ${crane["Ton"] || "N/A"}
• Expiration Date: ${crane["Expiration"]}
• Days Remaining: 4 days

🚨 CRITICAL: This crane will expire in 4 days!

IMMEDIATE ACTION REQUIRED:
1. 📅 Schedule inspection renewal TODAY
2. 📞 Contact inspection authorities immediately
3. 📋 Update documentation
4. 🔍 Plan maintenance schedule
5. 💰 Budget for renewal costs

URGENT TIMELINE:
• TODAY: Contact inspection authorities
• TOMORROW: Schedule inspection appointment
• Day 3: Complete inspection process
• Day 4: Update documentation

CONTACT INFORMATION:
• Inspection Authority: [Contact Details]
• Maintenance Team: [Contact Details]
• Documentation: [Contact Details]

This is an automated alert from the Crane Management System.
Generated on: ${new Date().toLocaleString()}

Best regards,
Crane Management Team
      `;
    } else if (alertType === 'expired') {
      subject = `🚨 CRANE EXPIRED - ${crane["Unit #"]} - URGENT ACTION REQUIRED`;
      text = `
Dear Supervisor,

🚨 URGENT: Your crane has EXPIRED!

CRANE DETAILS:
• Unit #: ${crane["Unit #"]}
• Make & Model: ${crane["Make and Model"]}
• Serial #: ${crane["Serial #"]}
• Year: ${crane["Year"] || "N/A"}
• Ton: ${crane["Ton"] || "N/A"}
• Expiration Date: ${crane["Expiration"]}
• Current Status: EXPIRED

🚨 CRITICAL: This crane is now EXPIRED and should NOT be used.

IMMEDIATE ACTION REQUIRED:
1. ⛔ STOP using this crane immediately
2. 📞 Contact our team for assistance
3. 🔍 Schedule emergency inspection
4. 📋 Update all documentation
5. 🚫 Remove from active service

SAFETY CONCERNS:
• Operating an expired crane is a safety violation
• Insurance may not cover expired equipment
• Legal compliance issues may arise

For immediate assistance, contact:
• Safety Department: [Phone Number]
• Maintenance Team: [Phone Number]
• Emergency Hotline: [Phone Number]

This is an automated alert from the Crane Management System.
Generated on: ${new Date().toLocaleString()}

Best regards,
Crane Management Team
      `;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: subject,
      text: text.trim()
    });
    
    console.log(`Email alert sent to ${recipientEmail} for crane ${crane["Unit #"]} - ${alertType}`);
    return true;
  } catch (error) {
    console.error(`Email sending failed for crane ${crane["Unit #"]}:`, error);
    return false;
  }
};

// Auto-email service is now handled by the dedicated service
// The cron schedules are managed in autoEmailService.js
console.log("✅ Auto-email service initialized from dedicated service");
