const mongoose = require("mongoose");

// ✅ Flexible schema for Excel uploads - matches exact field names from Excel
const craneSchema = new mongoose.Schema(
  {
    "Unit #": { 
      type: String, 
      required: true,
      unique: true, // Ensure Unit # is unique
      index: true   // Add index for faster lookups
    },
    "Year": String,
    "Make and Model": String,
    "Ton": String,
    "Serial #": String,
    "Expiration": String, // Keep as string so it matches Excel exactly
    "Currently In Use": String,
    active: Boolean
  },
  { strict: false } // Allows extra Excel columns to still be stored
);

// Add compound index for better performance
craneSchema.index({ "Unit #": 1, "Serial #": 1 });

module.exports = mongoose.model("Crane", craneSchema);
