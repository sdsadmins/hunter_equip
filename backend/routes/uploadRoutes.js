// backend/routes/uploadRoutes.js
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const Crane = require("../models/Crane");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Test route to check if upload routes are working
router.get("/test", (req, res) => {
  res.json({ message: "Upload routes are working!" });
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    console.log("File received:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    console.log("Reading Excel file...");
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    console.log("Excel file read successfully");
    console.log("Available sheets:", workbook.SheetNames);
    
    const sheetName = workbook.SheetNames[0];
    console.log("Using sheet:", sheetName);
    
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log("Excel data extracted successfully");
    
    // Debug: Log the first row to see what column names are actually in the Excel file
    console.log("Excel file column names:", Object.keys(sheetData[0] || {}));
    console.log("First row data:", sheetData[0]);
    
    // Log all possible column names to help identify the correct ones
    const allColumns = Object.keys(sheetData[0] || {});
    console.log("All available column names in Excel file:");
    allColumns.forEach((col, index) => {
      console.log(`${index + 1}. "${col}"`);
    });
    
    // Check if we have data
    if (sheetData.length === 0) {
      return res.status(400).json({ error: "No data found in Excel file" });
    }

    // Clear old cranes
    await Crane.deleteMany({});

    // Save new cranes — mapping all required fields with flexible column name matching
    const cranes = sheetData.map((row, index) => {
      console.log(`Processing row ${index + 1}:`, row);
      
      // Convert Excel date serial number to readable date
      let expirationDate = row["Expiration"] || row["expiration"] || "";
      
      // Handle DD-MM-YYYY format (like "09-08-2019")
      if (typeof expirationDate === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(expirationDate)) {
        // Convert DD-MM-YYYY to DD/MM/YYYY
        expirationDate = expirationDate.replace(/-/g, '/');
      } else if (typeof expirationDate === 'number' && expirationDate > 1000) {
        // This is likely an Excel date serial number
        const excelDate = new Date((expirationDate - 25569) * 86400 * 1000);
        const day = String(excelDate.getDate()).padStart(2, '0');
        const month = String(excelDate.getMonth() + 1).padStart(2, '0');
        const year = excelDate.getFullYear();
        expirationDate = `${day}/${month}/${year}`; // Format as DD/MM/YYYY
      } else if (typeof expirationDate === 'string' && /^\d{5,}$/.test(expirationDate)) {
        // Handle case where Excel date is stored as string number
        const excelDate = new Date((parseInt(expirationDate) - 25569) * 86400 * 1000);
        const day = String(excelDate.getDate()).padStart(2, '0');
        const month = String(excelDate.getMonth() + 1).padStart(2, '0');
        const year = excelDate.getFullYear();
        expirationDate = `${day}/${month}/${year}`; // Format as DD/MM/YYYY
      }
      
      // Try different possible column names for each field - based on your Excel file
      const craneData = {
        "Unit #": row["Unit #"] || row["Unit"] || row["unit"] || row["UNIT"] || row["Unit Number"] || row["unit number"] || "",
        "Year": row["Year"] || row["year"] || row["YEAR"] || row["Model Year"] || row["model year"] || row["MODEL YEAR"] || "",
        "Make and Model": row["Make and Model"] || row["Make & Model"] || row["Make and model"] || row["make and model"] || row["MAKE AND MODEL"] || row["Make"] || row["make"] || row["Model"] || row["model"] || "",
        "Ton": row["Ton"] || row["ton"] || row["TON"] || row["Capacity"] || row["capacity"] || row["CAPACITY"] || row["Tonnage"] || row["tonnage"] || row["TONNAGE"] || "",
        "Serial #": row["Serial #"] || row["Serial"] || row["serial"] || row["SERIAL"] || row["Serial Number"] || row["serial number"] || row["SERIAL NUMBER"] || row["Serial No"] || row["serial no"] || row["SERIAL NO"] || "",
        "Expiration": expirationDate,
        "Currently In Use": row["Currently In Use"] || row["In Use"] || row["in use"] || row["IN USE"] || row["Status"] || row["status"] || row["STATUS"] || "O",
        active: (row["Currently In Use"] || row["In Use"] || row["in use"] || row["IN USE"] || row["Status"] || row["status"] || row["STATUS"] || "O") === "O"
      };
      
      // Debug: Log what we found for each field
      console.log(`Row ${index + 1} field mapping:`);
      console.log(`  Unit #: "${row["Unit #"]}" -> "${craneData["Unit #"]}"`);
      console.log(`  Year: "${row["Year"]}" -> "${craneData["Year"]}"`);
      console.log(`  Make and Model: "${row["Make and Model"]}" -> "${craneData["Make and Model"]}"`);
      console.log(`  Ton: "${row["Ton"]}" -> "${craneData["Ton"]}"`);
      console.log(`  Serial #: "${row["Serial #"]}" -> "${craneData["Serial #"]}"`);
      console.log(`  Currently In Use: "${row["Currently In Use"]}" -> "${craneData["Currently In Use"]}"`);
      
      console.log(`Row ${index + 1} mapped crane data:`, craneData);
      return craneData;
    });

    console.log("Saving cranes to database:", cranes);
    await Crane.insertMany(cranes);
    
    // Verify what was actually saved
    const savedCranes = await Crane.find();
    console.log("Verification - Cranes saved to database:", savedCranes.length);
    if (savedCranes.length > 0) {
      console.log("First saved crane:", savedCranes[0]);
    }

    res.json({ message: "Upload successful" });
  } catch (err) {
    console.error("Upload error:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      error: "Upload failed", 
      details: err.message,
      type: err.name 
    });
  }
});

module.exports = router;