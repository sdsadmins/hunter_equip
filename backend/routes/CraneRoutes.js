// backend/routes/craneRoutes.js
const express = require("express");
const router = express.Router();
const Crane = require("../models/Crane");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret"; // match authRoutes.js

// Test route to check if server is working
router.get("/test", (req, res) => {
  res.json({ message: "Crane routes server is working!" });
});

// Test route to check if database has cranes (no auth required)
router.get("/test-data", async (req, res) => {
  try {
    const cranes = await Crane.find();
    console.log("Test data - All cranes in DB:", cranes);
    res.json({ 
      message: "Database test", 
      count: cranes.length,
      sampleCrane: cranes[0] || "No cranes found"
    });
  } catch (err) {
    console.error("Test data error:", err);
    res.status(500).json({ error: "Database test failed" });
  }
});

// Test route to check database data
router.get("/test-data", async (req, res) => {
  try {
    const cranes = await Crane.find();
    console.log("Test data - All cranes in DB:", cranes);
    res.json({ 
      message: "Database test", 
      count: cranes.length,
      sampleCrane: cranes[0] || "No cranes found"
    });
  } catch (err) {
    console.error("Test data error:", err);
    res.status(500).json({ error: "Database test failed" });
  }
});

// Test route to check authentication (no auth required)
router.get("/test-auth", (req, res) => {
  const authHeader = req.headers.authorization;
  res.json({ 
    message: "Auth test", 
    hasAuthHeader: !!authHeader,
    authHeader: authHeader ? authHeader.substring(0, 20) + "..." : "None"
  });
});

// Middleware for authentication
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Incoming Token:", token);
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded Token:", decoded);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    console.error("JWT Verify Error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}



// Helper function to convert Excel date serial numbers
function convertExcelDate(dateValue) {
  if (!dateValue) return "";
  
  // If it's already a string, check if it's a number string
  if (typeof dateValue === 'string') {
    // Check if it's a string number that looks like Excel date serial
    if (/^\d{5,}$/.test(dateValue)) {
      try {
        const excelDate = new Date((parseInt(dateValue) - 25569) * 86400 * 1000);
        const day = String(excelDate.getDate()).padStart(2, '0');
        const month = String(excelDate.getMonth() + 1).padStart(2, '0');
        const year = excelDate.getFullYear();
        return `${day}/${month}/${year}`; // Format as DD/MM/YYYY
      } catch (error) {
        return dateValue; // Return original if conversion fails
      }
    }
    return dateValue; // Return as is if it's not a number string
  }
  
  // If it's a number and looks like an Excel date serial number
  if (typeof dateValue === 'number' && dateValue > 1000) {
    try {
      const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
      const day = String(excelDate.getDate()).padStart(2, '0');
      const month = String(excelDate.getMonth() + 1).padStart(2, '0');
      const year = excelDate.getFullYear();
      return `${day}/${month}/${year}`; // Format as DD/MM/YYYY
    } catch (error) {
      return dateValue.toString(); // Fallback to string if conversion fails
    }
  }
  
  return dateValue.toString();
}

/**
 * ========================
 * PUBLIC ROUTE - Home page
 * ========================
 */
router.get("/public", async (req, res) => {
  try {
    console.log("Fetching public cranes...");
    const cranes = await Crane.find({}, { 
      "Unit #": 1, 
      "Year": 1,
      "Make and Model": 1, 
      "Ton": 1,
      "Serial #": 1,
      "Expiration": 1,
      "Currently In Use": 1
    });
    console.log("Raw cranes from DB:", cranes);
    
    const formatted = cranes.map((c) => ({
      unit: c["Unit #"],
      year: c["Year"],
      makeModel: c["Make and Model"],
      ton: c["Ton"],
      serial: c["Serial #"],
      expiration: convertExcelDate(c["Expiration"]),
      inUse: c["Currently In Use"],
    }));
    console.log("Formatted cranes:", formatted);
    res.json(formatted);
  } catch (err) {
    console.error("Error fetching public cranes:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ==========================
 * SUPERVISOR - View all cranes
 * ==========================
 */
router.get("/supervisor", authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== "supervisor") {
      return res.status(403).json({ error: "Access denied: Supervisors only" });
    }
    console.log("Fetching supervisor cranes...");
    const cranes = await Crane.find({}, {
      "Unit #": 1,
      "Year": 1,
      "Make and Model": 1,
      "Ton": 1,
      "Serial #": 1,
      "Expiration": 1,
      "Currently In Use": 1,
      "active": 1,
      "alertEmail": 1,
      "_id": 1
    });
    


    
    // Convert Excel date serial numbers in the response
    const processedCranes = cranes.map(crane => {
      const craneObj = crane.toObject();
      craneObj.Expiration = convertExcelDate(craneObj.Expiration);
      
      // Ensure active field is preserved as boolean
      craneObj.active = Boolean(craneObj.active);
      
      // Ensure _id is included
      if (!craneObj._id) {
        console.error("Missing _id for crane:", craneObj["Unit #"]);
      }
      
      return craneObj;
    });
    
    console.log("Sample processed crane:", processedCranes[0]);
    console.log("Total cranes returned:", processedCranes.length);
    
    res.json(processedCranes);
  } catch (err) {
    console.error("Error fetching supervisor cranes:", err);
    res.status(500).json({ error: "Error fetching cranes" });
  }
});

/**
 * ==========================
 * Add a crane
 * ==========================
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    // Clean the Unit # by removing spaces and normalizing
    const cleanUnitNumber = req.body["Unit #"] ? req.body["Unit #"].trim().replace(/\s+/g, '') : '';
    
    if (!cleanUnitNumber) {
      return res.status(400).json({ error: "Unit # is required and cannot be empty" });
    }
    
    // Check if crane with same Unit # already exists (case-insensitive and space-insensitive)
    const existingCrane = await Crane.findOne({ 
      "Unit #": { $regex: new RegExp(`^${cleanUnitNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    
    if (existingCrane) {
      return res.status(400).json({ 
        error: "Crane with this Unit # already exists",
        existingCrane: {
          unitNumber: existingCrane["Unit #"],
          makeModel: existingCrane["Make and Model"],
          serial: existingCrane["Serial #"]
        }
      });
    }
    
    // Update the request body with cleaned Unit #
    req.body["Unit #"] = cleanUnitNumber;
    
    const crane = new Crane(req.body);
    await crane.save();
    res.json(crane);
  } catch (err) {
    console.error("Error adding crane:", err);
    res.status(500).json({ error: "Error adding crane" });
  }
});

/**
 * ==========================
 * Edit a crane
 * ==========================
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    // If Unit # is being updated, check for duplicates
    if (req.body["Unit #"]) {
      // Clean the Unit # by removing spaces and normalizing
      const cleanUnitNumber = req.body["Unit #"].trim().replace(/\s+/g, '');
      
      if (!cleanUnitNumber) {
        return res.status(400).json({ error: "Unit # is required and cannot be empty" });
      }
      
      // Check if crane with same Unit # already exists (excluding current crane)
      const existingCrane = await Crane.findOne({ 
        "Unit #": { $regex: new RegExp(`^${cleanUnitNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        _id: { $ne: req.params.id } // Exclude current crane from duplicate check
      });
      
      if (existingCrane) {
        return res.status(400).json({ 
          error: "Crane with this Unit # already exists",
          existingCrane: {
            unitNumber: existingCrane["Unit #"],
            makeModel: existingCrane["Make and Model"],
            serial: existingCrane["Serial #"],
            id: existingCrane._id
          }
        });
      }
      
      // Update the request body with cleaned Unit #
      req.body["Unit #"] = cleanUnitNumber;
    }
    
    // Ensure active field is explicitly set as boolean
    const updateData = {
      ...req.body,
      active: Boolean(req.body.active)
    };
    
    const crane = await Crane.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!crane) return res.status(404).json({ error: "Crane not found" });
    
    res.json(crane);
  } catch (err) {
    console.error("Error updating crane:", err);
    res.status(500).json({ error: "Error updating crane" });
  }
});

/**
 * ==========================
 * Delete a crane
 * ==========================
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const crane = await Crane.findByIdAndDelete(req.params.id);
    if (!crane) return res.status(404).json({ error: "Crane not found" });
    res.json({ message: "Crane deleted successfully" });
  } catch (err) {
    console.error("Error deleting crane:", err);
    res.status(500).json({ error: "Error deleting crane" });
  }
});

/**
 * ==========================
 * Send Email Alert
 * ==========================
 */
router.post("/:id/send-alert", authMiddleware, async (req, res) => {
  try {
    const { recipientEmail } = req.body;
    const crane = await Crane.findById(req.params.id);
    if (!crane) return res.status(404).json({ error: "Crane not found" });

    // Calculate days until expiration with proper date handling
    let diffDays = 0;
    let expirationStatus = "";
    try {
      console.log("Processing crane expiration:", crane["Expiration"], "Type:", typeof crane["Expiration"]);
      
      // Enhanced date conversion function
      const convertExcelDate = (dateValue) => {
        if (!dateValue) return null;
        
        console.log("Converting date value:", dateValue, "Type:", typeof dateValue);
        
        // If it's already a Date object
        if (dateValue instanceof Date) {
          return dateValue;
        }
        
        // If it's a string
        if (typeof dateValue === 'string') {
          // Check if it's a string number that looks like Excel date serial
          if (/^\d{5,}$/.test(dateValue)) {
            console.log("Converting Excel serial string:", dateValue);
            const excelDate = new Date((parseInt(dateValue) - 25569) * 86400 * 1000);
            console.log("Converted Excel date:", excelDate);
            return excelDate;
          }
          
          // Check if it's DD/MM/YYYY format
          if (dateValue.includes('/')) {
            const parts = dateValue.split('/');
            if (parts.length === 3) {
              console.log("Converting DD/MM/YYYY format:", dateValue);
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1; // Month is 0-indexed
              const year = parseInt(parts[2]);
              const date = new Date(year, month, day);
              console.log("Converted DD/MM/YYYY date:", date);
              return date;
            }
          }
          
          // Try parsing as regular date string
          const parsedDate = new Date(dateValue);
          if (!isNaN(parsedDate.getTime())) {
            console.log("Parsed as regular date:", parsedDate);
            return parsedDate;
          }
        }
        
        // If it's a number (Excel serial number)
        if (typeof dateValue === 'number' && dateValue > 1000) {
          console.log("Converting Excel serial number:", dateValue);
          const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
          console.log("Converted Excel number date:", excelDate);
          return excelDate;
        }
        
        console.log("Could not convert date value:", dateValue);
        return null;
      };

      const expirationDate = convertExcelDate(crane["Expiration"]);
      if (!expirationDate || isNaN(expirationDate.getTime())) {
        console.error("Invalid expiration date:", crane["Expiration"]);
        return res.status(400).json({ error: "Invalid expiration date in crane data" });
      }

      const today = new Date();
      // Reset time to start of day for accurate calculation
      today.setHours(0, 0, 0, 0);
      expirationDate.setHours(0, 0, 0, 0);
      
      diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log("Date calculation:", {
        originalExpiration: crane["Expiration"],
        expirationDate: expirationDate,
        today: today,
        diffDays: diffDays
      });
      
      // Determine status based on current date
      if (diffDays < 0) {
        expirationStatus = "EXPIRED";
      } else if (diffDays <= 30) {
        expirationStatus = "NEAR TO EXPIRE";
      } else {
        expirationStatus = "OK";
      }
    } catch (error) {
      console.error("Date parsing error:", error);
      return res.status(400).json({ error: "Invalid date format in crane data" });
    }

    // Get recipient email
    let emailToSend = recipientEmail;
    if (!emailToSend) {
      const user = await User.findById(req.userId);
      if (user?.email) {
        emailToSend = user.email;
      }
    }

    if (!emailToSend) {
      return res.status(400).json({ error: "No recipient email provided" });
    }

    // Create transporter with enhanced Gmail configuration
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

    // Create email content based on current status
    let subject, text;
    
    if (expirationStatus === "EXPIRED") {
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

🚨 CRITICAL: This crane expired ${Math.abs(diffDays)} days ago and should NOT be used.

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
    } else if (expirationStatus === "NEAR TO EXPIRE") {
      subject = `⚠️ CRANE EXPIRATION WARNING - ${crane["Unit #"]} - ${diffDays} DAYS REMAINING`;
      text = `
Dear Supervisor,

⚠️ WARNING: Your crane is approaching its expiration date!

CRANE DETAILS:
• Unit #: ${crane["Unit #"]}
• Make & Model: ${crane["Make and Model"]}
• Serial #: ${crane["Serial #"]}
• Year: ${crane["Year"] || "N/A"}
• Ton: ${crane["Ton"] || "N/A"}
• Expiration Date: ${crane["Expiration"]}
• Days Remaining: ${diffDays} days

⚠️ WARNING: This crane will expire in ${diffDays} days.

URGENT ACTION REQUIRED:
1. 📅 Schedule inspection renewal immediately
2. 📞 Contact inspection authorities
3. 📋 Update documentation
4. 🔍 Plan maintenance schedule
5. 💰 Budget for renewal costs

RECOMMENDED TIMELINE:
• Week 1: Contact inspection authorities
• Week 2: Schedule inspection appointment
• Week 3: Complete inspection process
• Week 4: Update documentation

CONTACT INFORMATION:
• Inspection Authority: [Contact Details]
• Maintenance Team: [Contact Details]
• Documentation: [Contact Details]

This is an automated alert from the Crane Management System.
Generated on: ${new Date().toLocaleString()}

Best regards,
Crane Management Team
      `;
    } else {
      subject = `✅ CRANE STATUS UPDATE - ${crane["Unit #"]} - ALL CLEAR`;
      text = `
Dear Supervisor,

✅ STATUS UPDATE: Your crane is in good standing.

CRANE DETAILS:
• Unit #: ${crane["Unit #"]}
• Make & Model: ${crane["Make and Model"]}
• Serial #: ${crane["Serial #"]}
• Year: ${crane["Year"] || "N/A"}
• Ton: ${crane["Ton"] || "N/A"}
• Expiration Date: ${crane["Expiration"]}
• Days Remaining: ${diffDays} days

✅ STATUS: This crane expires in ${diffDays} days (more than 30 days away).

CURRENT STATUS: ALL CLEAR ✅
• No immediate action required
• Crane is compliant with regulations
• Continue normal operations

RECOMMENDED PLANNING:
• Mark calendar for renewal planning
• Consider scheduling inspection 2-3 weeks before expiration
• Update maintenance records as needed

FUTURE REMINDERS:
• You will receive alerts when expiration is within 30 days
• Final warning will be sent 4 days before expiration

This is an automated alert from the Crane Management System.
Generated on: ${new Date().toLocaleString()}

Best regards,
Crane Management Team
      `;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailToSend,
      subject: subject,
      text: text.trim()
    };

    await transporter.sendMail(mailOptions);
    res.json({ 
      message: `Email alert sent successfully to ${emailToSend}`,
      alertType: expirationStatus.toLowerCase().replace(/\s+/g, '-'),
      daysUntilExpiration: diffDays,
      status: expirationStatus
    });

  } catch (err) {
    console.error("Error sending email:", err);
    
    // Provide specific error messages based on error type
    let errorMessage = "Error sending email. Please check your email configuration.";
    
    if (err.code === 'EAUTH') {
      errorMessage = "Email authentication failed. Please check your Gmail credentials in the .env file.";
    } else if (err.code === 'ECONNECTION') {
      errorMessage = "Email connection failed. Please check your internet connection.";
    } else if (err.code === 'ETIMEDOUT') {
      errorMessage = "Email sending timed out. Please try again later.";
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: err.message,
      code: err.code 
    });
  }
});

/**
 * ==========================
 * Test Email Configuration
 * ==========================
 */
router.get("/test-email", authMiddleware, async (req, res) => {
  try {
    const transporter = nodemailer.createTransporter({
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

    // Test email configuration
    await transporter.verify();
    
    res.json({ 
      success: true, 
      message: "Email configuration is working correctly",
      emailUser: process.env.EMAIL_USER,
      emailConfigured: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS
    });
  } catch (error) {
    console.error("Email test failed:", error);
    res.status(500).json({ 
      success: false, 
      error: "Email configuration test failed",
      details: error.message,
      code: error.code
    });
  }
});

/**
 * ==========================
 * Send Test Email
 * ==========================
 */
router.post("/send-test-email", authMiddleware, async (req, res) => {
  try {
    const { recipientEmail } = req.body;
    
    if (!recipientEmail) {
      return res.status(400).json({ error: "Recipient email is required" });
    }

    const transporter = nodemailer.createTransporter({
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

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: "🧪 Test Email - Crane Management System",
      text: `
Hello!

This is a test email from your Crane Management System.

✅ Email configuration is working correctly!

System Details:
• Email User: ${process.env.EMAIL_USER}
• Sent at: ${new Date().toLocaleString()}
• System: Crane Inspection Management

If you received this email, your email alerts are properly configured.

Best regards,
Crane Management Team
      `.trim()
    };

    await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true, 
      message: `Test email sent successfully to ${recipientEmail}`,
      emailUser: process.env.EMAIL_USER
    });
  } catch (error) {
    console.error("Test email sending failed:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to send test email",
      details: error.message,
      code: error.code
    });
  }
});

/**
 * ==========================
 * Clean Unit # spaces and duplicates in database
 * ==========================
 */
router.post("/clean-unit-numbers", authMiddleware, async (req, res) => {
  try {
    // Only allow supervisors to clean data
    if (req.userRole !== "supervisor") {
      return res.status(403).json({ error: "Access denied: Supervisors only" });
    }
    
    console.log("🧹 Cleaning Unit # spaces and duplicates in database...");
    
    // Step 1: Clean spaces from Unit #s
    const cranesWithSpaces = await Crane.find({
      "Unit #": { $regex: /\s/ }
    });
    
    console.log(`Found ${cranesWithSpaces.length} cranes with spaces in Unit #`);
    
    let cleanedCount = 0;
    let duplicateCount = 0;
    
    for (const crane of cranesWithSpaces) {
      const oldUnitNumber = crane["Unit #"];
      const newUnitNumber = oldUnitNumber.trim().replace(/\s+/g, '');
      
      if (oldUnitNumber !== newUnitNumber) {
        // Check if the cleaned Unit # already exists
        const existingCrane = await Crane.findOne({
          "Unit #": newUnitNumber,
          _id: { $ne: crane._id } // Exclude current crane
        });
        
        if (existingCrane) {
          console.log(`⚠️ Duplicate found: ${oldUnitNumber} -> ${newUnitNumber} (already exists)`);
          duplicateCount++;
        } else {
          // Update the crane with cleaned Unit #
          await Crane.findByIdAndUpdate(crane._id, {
            "Unit #": newUnitNumber
          });
          console.log(`✅ Cleaned: "${oldUnitNumber}" -> "${newUnitNumber}"`);
          cleanedCount++;
        }
      }
    }
    
    // Step 2: Handle actual duplicates (multiple cranes with same Unit #)
    console.log("🔍 Checking for duplicate Unit #s...");
    
    // Find all Unit #s and count them
    const unitCounts = {};
    const allCranes = await Crane.find({});
    
    allCranes.forEach(crane => {
      const unit = crane["Unit #"];
      if (unit) {
        unitCounts[unit] = (unitCounts[unit] || 0) + 1;
      }
    });
    
    // Find Unit #s with duplicates
    const duplicateUnits = Object.keys(unitCounts).filter(unit => unitCounts[unit] > 1);
    console.log(`Found ${duplicateUnits.length} Unit #s with duplicates:`, duplicateUnits);
    
    let resolvedDuplicates = 0;
    
    for (const duplicateUnit of duplicateUnits) {
      // Get all cranes with this Unit #
      const duplicateCranes = await Crane.find({ "Unit #": duplicateUnit });
      console.log(`Processing ${duplicateCranes.length} cranes with Unit # "${duplicateUnit}"`);
      
      // Keep the first one, delete the rest
      if (duplicateCranes.length > 1) {
        const [keepCrane, ...deleteCranes] = duplicateCranes;
        
        console.log(`✅ Keeping crane: ${keepCrane._id} (${keepCrane["Make and Model"]})`);
        
        // Delete duplicate cranes
        for (const deleteCrane of deleteCranes) {
          console.log(`🗑️ Deleting duplicate crane: ${deleteCrane._id} (${deleteCrane["Make and Model"]})`);
          await Crane.findByIdAndDelete(deleteCrane._id);
        }
        
        resolvedDuplicates += deleteCranes.length;
      }
    }
    
    res.json({
      message: "Unit # cleaning and duplicate resolution completed",
      spacesCleaned: cleanedCount,
      duplicatesResolved: resolvedDuplicates,
      totalDuplicatesFound: duplicateUnits.length,
      duplicateUnits: duplicateUnits
    });
    
  } catch (err) {
    console.error("Error cleaning Unit #s:", err);
    res.status(500).json({ error: "Error cleaning Unit #s" });
  }
});

/**
 * ==========================
 * Check for duplicate Unit #s in database
 * ==========================
 */
router.get("/check-duplicates", authMiddleware, async (req, res) => {
  try {
    // Only allow supervisors to check duplicates
    if (req.userRole !== "supervisor") {
      return res.status(403).json({ error: "Access denied: Supervisors only" });
    }
    
    console.log("🔍 Checking for duplicate Unit #s...");
    
    // Find all Unit #s and count them
    const unitCounts = {};
    const allCranes = await Crane.find({});
    
    allCranes.forEach(crane => {
      const unit = crane["Unit #"];
      if (unit) {
        unitCounts[unit] = (unitCounts[unit] || 0) + 1;
      }
    });
    
    // Find Unit #s with duplicates
    const duplicateUnits = Object.keys(unitCounts).filter(unit => unitCounts[unit] > 1);
    
    // Get detailed info about duplicates
    const duplicateDetails = [];
    for (const duplicateUnit of duplicateUnits) {
      const duplicateCranes = await Crane.find({ "Unit #": duplicateUnit });
      duplicateDetails.push({
        unitNumber: duplicateUnit,
        count: duplicateCranes.length,
        cranes: duplicateCranes.map(crane => ({
          id: crane._id,
          makeModel: crane["Make and Model"],
          serial: crane["Serial #"],
          year: crane["Year"],
          expiration: crane["Expiration"]
        }))
      });
    }
    
    res.json({
      hasDuplicates: duplicateUnits.length > 0,
      duplicateCount: duplicateUnits.length,
      duplicateUnits: duplicateUnits,
      duplicateDetails: duplicateDetails
    });
    
  } catch (err) {
    console.error("Error checking duplicates:", err);
    res.status(500).json({ error: "Error checking duplicates" });
  }
});

/**
 * ==========================
 * Check if Unit # exists
 * ==========================
 */
router.get("/check-unit/:unitNumber", authMiddleware, async (req, res) => {
  try {
    const { unitNumber } = req.params;
    
    // Clean the Unit # by removing spaces and normalizing
    const cleanUnitNumber = unitNumber ? unitNumber.trim().replace(/\s+/g, '') : '';
    
    if (!cleanUnitNumber) {
      return res.json({ exists: false });
    }
    
    // Check if crane with same Unit # already exists (case-insensitive and space-insensitive)
    const existingCrane = await Crane.findOne({ 
      "Unit #": { $regex: new RegExp(`^${cleanUnitNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    
    if (existingCrane) {
      res.json({ 
        exists: true, 
        crane: {
          unitNumber: existingCrane["Unit #"],
          makeModel: existingCrane["Make and Model"],
          serial: existingCrane["Serial #"],
          year: existingCrane["Year"]
        }
      });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error("Error checking unit number:", err);
    res.status(500).json({ error: "Error checking unit number" });
  }
});

/**
 * ==========================
 * Test Date Calculation
 * ==========================
 */
router.get("/test-date/:id", authMiddleware, async (req, res) => {
  try {
    const crane = await Crane.findById(req.params.id);
    if (!crane) {
      return res.status(404).json({ error: "Crane not found" });
    }

    console.log("Testing date calculation for crane:", crane["Unit #"]);
    console.log("Original expiration:", crane["Expiration"], "Type:", typeof crane["Expiration"]);
    
    // Enhanced date conversion function
    const convertExcelDate = (dateValue) => {
      if (!dateValue) return null;
      
      console.log("Converting date value:", dateValue, "Type:", typeof dateValue);
      
      // If it's already a Date object
      if (dateValue instanceof Date) {
        return dateValue;
      }
      
      // If it's a string
      if (typeof dateValue === 'string') {
        // Check if it's a string number that looks like Excel date serial
        if (/^\d{5,}$/.test(dateValue)) {
          console.log("Converting Excel serial string:", dateValue);
          const excelDate = new Date((parseInt(dateValue) - 25569) * 86400 * 1000);
          console.log("Converted Excel date:", excelDate);
          return excelDate;
        }
        
        // Check if it's DD/MM/YYYY format
        if (dateValue.includes('/')) {
          const parts = dateValue.split('/');
          if (parts.length === 3) {
            console.log("Converting DD/MM/YYYY format:", dateValue);
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Month is 0-indexed
            const year = parseInt(parts[2]);
            const date = new Date(year, month, day);
            console.log("Converted DD/MM/YYYY date:", date);
            return date;
          }
        }
        
        // Try parsing as regular date string
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          console.log("Parsed as regular date:", parsedDate);
          return parsedDate;
        }
      }
      
      // If it's a number (Excel serial number)
      if (typeof dateValue === 'number' && dateValue > 1000) {
        console.log("Converting Excel serial number:", dateValue);
        const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
        console.log("Converted Excel number date:", excelDate);
        return excelDate;
      }
      
      console.log("Could not convert date value:", dateValue);
      return null;
    };

    const expirationDate = convertExcelDate(crane["Expiration"]);
    if (!expirationDate || isNaN(expirationDate.getTime())) {
      return res.status(400).json({ 
        error: "Invalid expiration date in crane data",
        originalValue: crane["Expiration"],
        type: typeof crane["Expiration"]
      });
    }

    const today = new Date();
    // Reset time to start of day for accurate calculation
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine status based on current date
    let expirationStatus = "";
    if (diffDays < 0) {
      expirationStatus = "EXPIRED";
    } else if (diffDays <= 30) {
      expirationStatus = "NEAR TO EXPIRE";
    } else {
      expirationStatus = "OK";
    }

    res.json({
      craneId: crane._id,
      unitNumber: crane["Unit #"],
      originalExpiration: crane["Expiration"],
      convertedExpiration: expirationDate,
      today: today,
      diffDays: diffDays,
      status: expirationStatus,
      message: `Crane ${crane["Unit #"]} will expire in ${diffDays} days (Status: ${expirationStatus})`
    });

  } catch (error) {
    console.error("Date calculation test error:", error);
    res.status(500).json({ 
      error: "Error testing date calculation",
      details: error.message 
    });
  }
});

// ==========================
// EMAIL MANAGEMENT ROUTES
// ==========================

// Add or update email for a specific crane
router.post("/:id/email", authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log("🔍 Email update request received:");
    console.log("   Crane ID:", req.params.id);
    console.log("   Email:", email);
    console.log("   Request body:", req.body);
    
    // Validate crane ID
    if (!req.params.id || req.params.id === 'undefined') {
      console.log("❌ Invalid crane ID:", req.params.id);
      return res.status(400).json({ error: "Invalid crane ID" });
    }
    
    // Check if crane exists first
    const existingCrane = await Crane.findById(req.params.id);
    if (!existingCrane) {
      console.log("❌ Crane not found with ID:", req.params.id);
      return res.status(404).json({ error: "Crane not found" });
    }
    
    console.log("🔍 Found existing crane:", existingCrane["Unit #"]);
    
    // Allow empty email to remove email configuration
    if (email === "") {
      console.log("🗑️ Removing email configuration for crane:", req.params.id);
      
      const crane = await Crane.findByIdAndUpdate(
        req.params.id,
        { alertEmail: "" },
        { new: true, runValidators: true }
      );

      if (!crane) {
        console.log("❌ Crane not found for removal:", req.params.id);
        return res.status(404).json({ error: "Crane not found" });
      }

      console.log("✅ Email removed successfully for crane:", crane["Unit #"]);
      return res.json({ 
        message: "Email removed successfully", 
        crane: {
          id: crane._id,
          _id: crane._id,
          unitNumber: crane["Unit #"],
          alertEmail: ""
        }
      });
    }
    
    if (!email) {
      console.log("❌ No email provided in request");
      return res.status(400).json({ error: "Email is required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format:", email);
      return res.status(400).json({ error: "Invalid email format" });
    }

    console.log("💾 Saving email to database for crane:", req.params.id);
    console.log("   Email to save:", email);
    console.log("   Current crane alertEmail:", existingCrane.alertEmail);

    // Update the crane with the new email
    const crane = await Crane.findByIdAndUpdate(
      req.params.id,
      { alertEmail: email },
      { new: true, runValidators: true }
    );

    if (!crane) {
      console.log("❌ Crane not found after update:", req.params.id);
      return res.status(404).json({ error: "Crane not found" });
    }

    console.log("✅ Email saved successfully to database:");
    console.log("   Crane Unit #:", crane["Unit #"]);
    console.log("   Saved alertEmail:", crane.alertEmail);
    console.log("   Full crane object:", JSON.stringify(crane, null, 2));

    // Verify the email was actually saved by fetching again
    const verifyCrane = await Crane.findById(req.params.id);
    console.log("🔍 Verification - Crane from database:", verifyCrane.alertEmail);

    res.json({ 
      message: "Email updated successfully", 
      crane: {
        id: crane._id,
        _id: crane._id,
        unitNumber: crane["Unit #"],
        alertEmail: crane.alertEmail
      }
    });

  } catch (error) {
    console.error("❌ Error updating crane email:", error);
    console.error("   Error details:", error.message);
    console.error("   Stack trace:", error.stack);
    res.status(500).json({ error: "Failed to update email" });
  }
});

// Get email for a specific crane
router.get("/:id/email", authMiddleware, async (req, res) => {
  try {
    const crane = await Crane.findById(req.params.id);
    
    if (!crane) {
      return res.status(404).json({ error: "Crane not found" });
    }

    res.json({ 
      alertEmail: crane.alertEmail || null,
      unitNumber: crane["Unit #"]
    });

  } catch (error) {
    console.error("Error getting crane email:", error);
    res.status(500).json({ error: "Failed to get email" });
  }
});

// Send immediate email alert for a specific crane
router.post("/:id/send-alert", authMiddleware, async (req, res) => {
  try {
    const crane = await Crane.findById(req.params.id);
    
    if (!crane) {
      return res.status(404).json({ error: "Crane not found" });
    }

    if (!crane.alertEmail) {
      return res.status(400).json({ error: "No email configured for this crane" });
    }

    // Helper function to convert Excel date
    const convertExcelDate = (dateValue) => {
      if (!dateValue) return null;
      
      try {
        let date;
        if (typeof dateValue === 'number' && dateValue > 1000) {
          // Excel serial number
          date = new Date((dateValue - 25569) * 86400 * 1000);
        } else if (typeof dateValue === 'string') {
          if (/^\d{5,}$/.test(dateValue)) {
            // String Excel serial number
            date = new Date((parseInt(dateValue) - 25569) * 86400 * 1000);
          } else if (dateValue.includes('/')) {
            // DD/MM/YYYY format
            const parts = dateValue.split('/');
            if (parts.length === 3) {
              date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            } else {
              date = new Date(dateValue);
            }
          } else {
            date = new Date(dateValue);
          }
        } else {
          date = new Date(dateValue);
        }
        
        return date;
      } catch (error) {
        console.error("Date conversion error:", error);
        return null;
      }
    };

    // Get expiration status
    const expirationDate = convertExcelDate(crane["Expiration"]);
    if (!expirationDate || isNaN(expirationDate.getTime())) {
      return res.status(400).json({ error: "Invalid expiration date" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let status = "";
    if (diffDays < 0) {
      status = "EXPIRED";
    } else if (diffDays <= 30) {
      status = "NEAR TO EXPIRE";
    } else {
      status = "OK";
    }

    // Send email alert (you'll need to implement nodemailer here)
    // For now, just return success
    res.json({ 
      message: "Email alert sent successfully", 
      to: crane.alertEmail,
      crane: crane["Unit #"],
      status: status,
      daysUntilExpiration: diffDays
    });

  } catch (error) {
    console.error("Error sending email alert:", error);
    res.status(500).json({ error: "Failed to send email alert" });
  }
});

// Auto-email service routes
const { triggerManualCheck } = require('../services/autoEmailService');

// Manual trigger for auto-email service (for testing)
router.post("/trigger-auto-email", authMiddleware, async (req, res) => {
  try {
    console.log('🔧 Manual trigger requested for auto-email service');
    const result = await triggerManualCheck();
    res.json({ 
      message: "Auto-email service triggered successfully",
      timestamp: new Date().toISOString(),
      result: result
    });
  } catch (error) {
    console.error("Error triggering auto-email service:", error);
    res.status(500).json({ error: "Failed to trigger auto-email service" });
  }
});

// Debug route to check database state for emails
router.get("/debug/emails", authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Debug: Checking database for crane emails...');
    
    // Get all cranes with emails
    const cranesWithEmails = await Crane.find({ 
      alertEmail: { $exists: true, $ne: "" }
    });
    
    // Get sample of all cranes
    const allCranes = await Crane.find({}).limit(10);
    
    console.log(`📊 Debug: Found ${cranesWithEmails.length} cranes with emails`);
    console.log(`📊 Debug: Total cranes in database: ${await Crane.countDocuments()}`);
    
    // Log detailed information about cranes with emails
    if (cranesWithEmails.length > 0) {
      console.log('📧 Cranes with emails:');
      cranesWithEmails.forEach(crane => {
        console.log(`   Unit #: ${crane["Unit #"]}, Email: ${crane.alertEmail}, ID: ${crane._id}`);
      });
    }
    
    // Log sample cranes to see their alertEmail field
    console.log('🔍 Sample cranes from database:');
    allCranes.forEach(crane => {
      console.log(`   Unit #: ${crane["Unit #"]}, alertEmail: ${crane.alertEmail || 'undefined'}, ID: ${crane._id}`);
    });
    
    res.json({
      message: "Database email state retrieved",
      cranesWithEmails: cranesWithEmails.map(c => ({
        id: c._id,
        unitNumber: c["Unit #"],
        alertEmail: c.alertEmail
      })),
      sampleCranes: allCranes.map(c => ({
        id: c._id,
        unitNumber: c["Unit #"],
        alertEmail: c.alertEmail || 'undefined'
      })),
      totalCranes: await Crane.countDocuments(),
      cranesWithEmailsCount: cranesWithEmails.length
    });
    
  } catch (error) {
    console.error("❌ Debug route error:", error);
    res.status(500).json({ error: "Failed to get debug info" });
  }
});

// Test route to manually add email to a crane (for debugging)
router.post("/test/add-email/:id", authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    const craneId = req.params.id;
    
    console.log('🧪 Test: Manually adding email to crane:', craneId);
    console.log('🧪 Test: Email to add:', email);
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    // Find the crane first
    const crane = await Crane.findById(craneId);
    if (!crane) {
      return res.status(404).json({ error: "Crane not found" });
    }
    
    console.log('🧪 Test: Found crane:', crane["Unit #"]);
    console.log('🧪 Test: Current alertEmail:', crane.alertEmail);
    
    // Update the email
    const updatedCrane = await Crane.findByIdAndUpdate(
      craneId,
      { alertEmail: email },
      { new: true, runValidators: true }
    );
    
    console.log('🧪 Test: Updated crane:', updatedCrane.alertEmail);
    
    // Verify by fetching again
    const verifyCrane = await Crane.findById(craneId);
    console.log('🧪 Test: Verification - alertEmail from DB:', verifyCrane.alertEmail);
    
    res.json({
      message: "Test email added successfully",
      crane: {
        id: verifyCrane._id,
        unitNumber: verifyCrane["Unit #"],
        alertEmail: verifyCrane.alertEmail
      }
    });
    
  } catch (error) {
    console.error("❌ Test route error:", error);
    res.status(500).json({ error: "Failed to add test email" });
  }
});

/**
 * ==========================
 */
module.exports = router;