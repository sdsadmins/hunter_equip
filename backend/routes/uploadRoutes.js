// backend/routes/uploadRoutes.js
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const Crane = require("../models/Crane");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Normalize expiration to strict MM/DD/YYYY
const normalizeExpirationForStorage = (value) => {
  if (!value) return value;

  // Excel serial (number)
  if (typeof value === 'number' && value > 1000) {
    const d = new Date((value - 25569) * 86400 * 1000);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  // Excel serial as string
  if (typeof value === 'string' && /^\d{5,}$/.test(value)) {
    const d = new Date((parseInt(value, 10) - 25569) * 86400 * 1000);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  // If looks like DD-MM-YYYY -> treat as DD/MM/YYYY then normalize
  if (typeof value === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(value)) {
    value = value.replace(/-/g, '/');
  }

  // If looks like DD/MM/YYYY or MM/DD/YYYY
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [p1, p2, y] = value.split('/');
    const a = parseInt(p1, 10);
    const b = parseInt(p2, 10);
    if (a > 12 && b <= 12) {
      // DD/MM/YYYY -> MM/DD/YYYY
      return `${p2.padStart(2, '0')}/${p1.padStart(2, '0')}/${y}`;
    }
    return `${p1}/${p2}/${y}`; // already MM/DD/YYYY
  }

  // Fallback generic date parsing
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return value;
  }
};

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

    // Check for duplicate Unit #s before processing
    const existingCranes = await Crane.find({});
    const existingUnitNumbers = new Set(existingCranes.map(crane => crane["Unit #"]));
    
    // Check for duplicates in the new data
    const newUnitNumbers = new Set();
    const duplicateUnitNumbers = [];
    
    sheetData.forEach((row, index) => {
      const unitNumber = row["Unit #"] || row["Unit"] || row["unit"] || row["UNIT"] || row["Unit Number"] || row["unit number"] || "";
      if (unitNumber) {
        if (newUnitNumbers.has(unitNumber)) {
          duplicateUnitNumbers.push({ row: index + 1, unitNumber });
        } else if (existingUnitNumbers.has(unitNumber)) {
          duplicateUnitNumbers.push({ row: index + 1, unitNumber, existing: true });
        } else {
          newUnitNumbers.add(unitNumber);
        }
      }
    });
    
    // If there are duplicates, return error with details
    if (duplicateUnitNumbers.length > 0) {
      const duplicateDetails = duplicateUnitNumbers.map(dup => 
        dup.existing 
          ? `Row ${dup.row}: Unit # "${dup.unitNumber}" already exists in database`
          : `Row ${dup.row}: Unit # "${dup.unitNumber}" appears multiple times in Excel file`
      ).join('\n');
      
      return res.status(400).json({ 
        error: "Duplicate Unit #s found", 
        details: duplicateDetails,
        duplicates: duplicateUnitNumbers
      });
    }

    // Save new cranes — mapping all required fields with flexible column name matching
    const cranes = sheetData.map((row, index) => {
      console.log(`Processing row ${index + 1}:`, row);
      
      // Normalize any incoming expiration to MM/DD/YYYY
      let expirationDate = row["Expiration"] || row["expiration"] || "";
      expirationDate = normalizeExpirationForStorage(expirationDate);
      
      // Try different possible column names for each field - based on your Excel file
      const craneData = {
        "Unit #": (row["Unit #"] || row["Unit"] || row["unit"] || row["UNIT"] || row["Unit Number"] || row["unit number"] || "").trim().replace(/\s+/g, ''),
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