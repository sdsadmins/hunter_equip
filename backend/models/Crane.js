const mongoose = require("mongoose");

// ✅ Flexible schema for Excel uploads - matches exact field names from Excel
const craneSchema = new mongoose.Schema(
  {
    "Unit #": String,
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

module.exports = mongoose.model("Crane", craneSchema);
