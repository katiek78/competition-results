// Test parseNumber function with comma decimal separator

function parseNumber(input) {
  if (input === null || input === undefined) return NaN;
  if (typeof input === "number") return input;
  const s = String(input).trim().replace(/\s+/g, ""); // remove spaces
  // Replace comma with dot to allow German decimal separator
  const normalized = s.replace(/,/g, ".");
  const n = parseFloat(normalized);
  return isNaN(n) ? NaN : n;
}

// Test cases
const testCases = [
  { input: "33,44", expected: 33.44 },
  { input: "33.44", expected: 33.44 },
  { input: "45,23", expected: 45.23 },
  { input: "52", expected: 52 },
  { input: "123,456", expected: 123.456 },
];

console.log("Testing parseNumber function:");
testCases.forEach(({ input, expected }) => {
  const result = parseNumber(input);
  const passed = result === expected;
  console.log(
    `Input: "${input}" -> Result: ${result}, Expected: ${expected}, Passed: ${passed}`
  );
});
