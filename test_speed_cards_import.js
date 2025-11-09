// Test script to verify Speed Cards import parsing logic

function testSpeedCardsImportParsing() {
  const testCases = [
    {
      name: "Speed Cards - 3 columns (name, score, time)",
      input: "John Smith\t52\t45.23",
      isSpeedCards: true,
      expected: {
        name: "John Smith",
        category: "",
        score: "52",
        time: "45.23",
      },
    },
    {
      name: "Speed Cards - 4 columns (name, category, score, time)",
      input: "Jane Doe\tSenior\t52\t42.15",
      isSpeedCards: true,
      expected: {
        name: "Jane Doe",
        category: "Senior",
        score: "52",
        time: "42.15",
      },
    },
    {
      name: "Speed Cards - 2 columns (name, score, default time)",
      input: "Bob Wilson\t52",
      isSpeedCards: true,
      expected: { name: "Bob Wilson", category: "", score: "52", time: "0" },
    },
    {
      name: "Non-Speed Cards - 2 columns (name, score)",
      input: "Alice Brown\t123",
      isSpeedCards: false,
      expected: { name: "Alice Brown", category: "", score: "123", time: "0" },
    },
    {
      name: "Non-Speed Cards - 3 columns with category (name, category, score)",
      input: "Charlie Green\tAdult\t456",
      isSpeedCards: false,
      expected: {
        name: "Charlie Green",
        category: "Adult",
        score: "456",
        time: "0",
      },
    },
    {
      name: "Non-Speed Cards - 3 columns with age (name, age, score)",
      input: "David Black\t25\t789",
      isSpeedCards: false,
      expected: { name: "David Black", category: "", score: "789", time: "0" },
    },
  ];

  console.log("Testing Speed Cards Import Parsing Logic\n");

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Input: "${testCase.input}"`);
    console.log(`Is Speed Cards: ${testCase.isSpeedCards}`);

    // Simulate the parsing logic from CompetitionResults.js
    const parts = testCase.input.split("\t").map((item) => item.trim());
    let name, category, score, time;

    if (testCase.isSpeedCards) {
      // Speed Cards format: name, score, time OR name, category, score, time
      if (parts.length === 3) {
        // Three columns: name, score, time
        [name, score, time] = parts;
        category = "";
      } else if (parts.length === 4) {
        // Four columns: name, category, score, time
        [name, category, score, time] = parts;
      } else if (parts.length === 2) {
        // Two columns: name, score (time defaults to 0)
        [name, score] = parts;
        category = "";
        time = "0";
      } else {
        // Invalid format for Speed Cards
        name = parts[0] || "";
        category = "";
        score = "";
        time = "0";
      }
    } else {
      // Non-Speed Cards format (original logic)
      if (parts.length === 2) {
        // Two columns: name, score
        [name, score] = parts;
        category = "";
      } else if (parts.length >= 3) {
        // Three or more columns: check if second column is numeric (age group to ignore)
        const secondColumn = parts[1];
        const isNumeric =
          !isNaN(parseFloat(secondColumn)) && isFinite(secondColumn);

        if (isNumeric) {
          // Second column is numeric (age group), ignore it: name, age_group, score
          [name, , score] = parts;
          category = "";
        } else {
          // Second column is text (category), keep it: name, category, score
          [name, category, score] = parts;
        }
      } else {
        // Only one column or invalid format
        name = parts[0] || "";
        category = "";
        score = "";
      }
      time = "0"; // Default time for non-Speed Cards
    }

    const result = { name, category, score, time };
    const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);

    console.log(`Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`Got:      ${JSON.stringify(result)}`);
    console.log(`Result: ${passed ? "✓ PASS" : "✗ FAIL"}`);
    console.log("");
  });
}

testSpeedCardsImportParsing();
