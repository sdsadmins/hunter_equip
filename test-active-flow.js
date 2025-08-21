// Test the complete data flow for active status
console.log("=== Testing Active Status Data Flow ===\n");

// 1. Simulate crane data from database
const originalCrane = {
  _id: "test123",
  "Unit #": "TEST-001",
  "Year": "2020",
  "Make and Model": "Test Crane",
  "Ton": "50",
  "Serial #": "12345",
  "Expiration": "25/12/2024",
  "Currently In Use": "O",
  active: false  // This should be false
};

console.log("1. Original crane from database:", originalCrane);
console.log("   Active status:", originalCrane.active, "Type:", typeof originalCrane.active);

// 2. Simulate form data when editing
const formData = {
  "Unit #": originalCrane["Unit #"],
  "Year": originalCrane["Year"],
  "Make and Model": originalCrane["Make and Model"],
  "Ton": originalCrane["Ton"],
  "Serial #": originalCrane["Serial #"],
  "Expiration": originalCrane["Expiration"],
  "Currently In Use": originalCrane["Currently In Use"],
  active: false  // User sets this to false
};

console.log("\n2. Form data when editing:", formData);
console.log("   Active status:", formData.active, "Type:", typeof formData.active);

// 3. Simulate data sent to backend
const backendData = { ...formData };
console.log("\n3. Data sent to backend:", backendData);
console.log("   Active status:", backendData.active, "Type:", typeof backendData.active);

// 4. Simulate database update
const updatedCrane = { ...originalCrane, ...backendData };
console.log("\n4. Updated crane in database:", updatedCrane);
console.log("   Active status:", updatedCrane.active, "Type:", typeof updatedCrane.active);

// 5. Simulate data returned from backend
const responseData = { ...updatedCrane };
console.log("\n5. Data returned from backend:", responseData);
console.log("   Active status:", responseData.active, "Type:", typeof responseData.active);

// 6. Simulate frontend processing
const frontendData = { ...responseData };
console.log("\n6. Data processed by frontend:", frontendData);
console.log("   Active status:", frontendData.active, "Type:", typeof frontendData.active);

// 7. Test sorting logic
const testCranes = [
  { "Unit #": "ACTIVE-001", active: true },
  { "Unit #": "INACTIVE-001", active: false },
  { "Unit #": "ACTIVE-002", active: true }
];

console.log("\n7. Test sorting with multiple cranes:");
console.log("   Before sorting:", testCranes.map(c => ({ unit: c["Unit #"], active: c.active })));

const sorted = testCranes.sort((a, b) => {
  if (a.active !== b.active) {
    return a.active ? -1 : 1; // Active cranes first
  }
  return 0;
});

console.log("   After sorting:", sorted.map(c => ({ unit: c["Unit #"], active: c.active })));

console.log("\n=== Test Complete ===");

