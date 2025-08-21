// Simple test to verify active status
const testCranes = [
  {
    "Unit #": "TEST-001",
    "Year": "2020",
    "Make and Model": "Test Crane",
    "Ton": "50",
    "Serial #": "12345",
    "Expiration": "25/12/2024",
    "Currently In Use": "O",
    active: false  // This should be false
  }
];

console.log("Test crane data:", testCranes[0]);
console.log("Active status:", testCranes[0].active);
console.log("Active status type:", typeof testCranes[0].active);

// Test the sorting logic
const sorted = testCranes.sort((a, b) => {
  if (a.active !== b.active) {
    return a.active ? -1 : 1; // Active cranes first
  }
  return 0;
});

console.log("Sorted result:", sorted);

