import axios from "axios";
import Cookies from "universal-cookie";
import { backendUrl, getDisciplineNameFromRef } from "./constants";
import ExcelJS from "exceljs";

export const countryNameToCode = {
  "United States": "US",
  "United Kingdom": "GB",
  Canada: "CA",
  Australia: "AU",
  Germany: "DE",
  France: "FR",
  Finland: "FI",
  Sweden: "SE",
  Norway: "NO",
  Denmark: "DK",
  Estonia: "EE",
  Latvia: "LV",
  Lithuania: "LT",
  Poland: "PL",
  Russia: "RU",
  Japan: "JP",
  China: "CN",
  India: "IN",
  Italy: "IT",
  Turkey: "TR",
  Spain: "ES",
  Portugal: "PT",
  Netherlands: "NL",
  Belgium: "BE",
  Switzerland: "CH",
  Mongolia: "MN",
  Austria: "AT",
  Uzbekistan: "UZ",
  Philippines: "PH",
  // ...add more as needed
};

export function getFlagEmoji(countryName) {
  try {
    if (!countryName || countryName === "(none)") return null;

    // Special case for England - return England flag emoji
    if (countryName === "England") {
      return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
    }

    // Special case for Wales - return Wales flag emoji
    if (countryName === "Wales") {
      return "🏴󠁧󠁢󠁷󠁬󠁳󠁿";
    }

    // Special case for Scotland - return Scotland flag emoji
    if (countryName === "Scotland") {
      return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
    }

    // Special case for Northern Ireland - return Northern Ireland flag emoji
    if (countryName === "Northern Ireland") {
      return "🇬🇧";
    }

    let code = countryNameToCode[countryName];
    if (!code && countryName.length === 2) code = countryName.toUpperCase();
    if (!code) return "(" + countryName + ")";

    // Add error handling for mobile Safari Unicode issues
    return code
      .toUpperCase()
      .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
  } catch (error) {
    // Fallback for mobile browsers with Unicode issues
    console.warn("Error generating flag emoji for", countryName, ":", error);
    return countryName ? `(${countryName})` : null;
  }
}

export const getToken = () => {
  const cookies = new Cookies();
  return cookies.get("TOKEN");
};

export const exportCompetitionToExcel = async (
  compTitle,
  disciplines,
  data
) => {
  const workbook = new ExcelJS.Workbook();
  const overallSheet = workbook.addWorksheet("Overall");

  // Define columns for Overall sheet
  overallSheet.columns = [
    { header: "Position", key: "position", width: 10 },
    { header: "Name", key: "name", width: 25 },
    { header: "Total", key: "total", width: 10 },
    { header: "Unrounded", key: "unroundedTotal", width: 12 },
    ...disciplines.map((discipline) => ({
      header: getDisciplineNameFromRef(discipline),
      key: discipline,
      width: 25,
    })),
  ];

  // Add data rows to Overall sheet
  data.forEach((row, index) => {
    const processedRow = {
      position: index + 1,
      name: row.name,
      total: row.total,
      unroundedTotal: row.unroundedTotal,
      ...disciplines.reduce(
        (acc, discipline) => ({
          ...acc,
          [discipline]: row[discipline]?.champ || "",
        }),
        {}
      ),
    };

    const excelRow = overallSheet.addRow(processedRow);

    // Alternate row styling
    excelRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: index % 2 === 0 ? "F2F2F2" : "FFFFFF" }, // Light grey for even rows
    };

    // Apply alternate styling specifically for Champs points column
    excelRow.getCell(3).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: index % 2 === 0 ? "66CC00" : "77FF00" }, // Darker green for even rows
    };
    excelRow.getCell(3).font = { bold: true };

    // Apply orange formatting for discipline columns, excluding "SC" and "K" and "5N"
    disciplines.forEach((discipline, colIndex) => {
      const cell = excelRow.getCell(colIndex + 5); // +5 because first 5 columns are fixed
      if (
        !discipline.includes("SC") &&
        !discipline.includes("K") &&
        !discipline.startsWith("5N")
      ) {
        // Exclude SC and K and 5N columns
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: index % 2 === 0 ? "FF7700" : "CC6200" }, // Orange and darker orange for alternate rows
        };
      }
    });
  });

  // Highlight highest SC and K and 5N values per row
  overallSheet.eachRow((row, rowIndex) => {
    let highestSC = -Infinity,
      highestK = -Infinity,
      highest5N = -Infinity;
    let highestSCCell = null,
      highestKCell = null,
      highest5NCell = null;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = overallSheet.getColumn(colNumber).key;
      const value = parseFloat(cell.value);

      if (key.includes("SC") && value > highestSC) {
        highestSC = value;
        highestSCCell = cell;
      }
      if (key.includes("K") && value > highestK) {
        highestK = value;
        highestKCell = cell;
      }
      if (key.startsWith("5N") && value > highest5N) {
        highest5N = value;
        highest5NCell = cell;
      }
    });

    const fillColor = rowIndex % 2 === 0 ? "FF7700" : "CC6200"; // Orange for SC and K cells

    if (highestSCCell) {
      highestSCCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fillColor },
      };
      highestSCCell.font = { bold: true };
    }
    if (highestKCell) {
      highestKCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fillColor },
      };
      highestKCell.font = { bold: true };
    }
    if (highest5NCell) {
      highest5NCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fillColor },
      };
      highest5NCell.font = { bold: true };
    }
  });

  // Apply header styling
  overallSheet.getRow(1).font = { bold: true };
  overallSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFF00" }, // Yellow header background
  };

  // Create tabs for each discipline
  disciplines.forEach((discipline) => {
    const sheet = workbook.addWorksheet(getDisciplineNameFromRef(discipline));
    sheet.columns = [
      { header: "Position", key: "position", width: 10 },
      { header: "Name", key: "name", width: 25 },
      { header: "Raw score", key: "raw", width: 20 },
      ...(discipline.includes("SC")
        ? [{ header: "Time", key: "time", width: 20 }]
        : []),
      { header: "Champ. pts", key: "total", width: 20 },
    ];

    const sortedData = data
      .map((row) => ({
        name: row.name,
        raw: row[discipline]?.raw || "",
        time: discipline.includes("SC") ? row[discipline]?.time || "" : "",
        champ: row[discipline]?.champ || "",
      }))
      .sort((a, b) => b.champ - a.champ);

    sortedData.forEach((row, index) => {
      const excelRow = sheet.addRow({
        position: index + 1,
        name: row.name,
        raw: row.raw,
        time: row.time,
        total: row.champ,
      });

      excelRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: index % 2 === 0 ? "F2F2F2" : "FFFFFF" }, // Light grey for even rows
      };

      excelRow.getCell(sheet.columnCount).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: index % 2 === 0 ? "66CC00" : "77FF00" }, // Darker green for even rows
      };
    });

    // Add champ pts styling
    sheet.getColumn(sheet.columnCount).font = { bold: true };
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF00" }, // Yellow header background
    };
  });

  // Write to a buffer and create a download link
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${compTitle} results.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};

// export const exportCompetitionToExcel = async (
//   compTitle,
//   disciplines,
//   data
// ) => {
//   console.log(data);
//   const workbook = new ExcelJS.Workbook();

//   //Overall tab
//   const worksheet = workbook.addWorksheet("Overall");
//   worksheet.columns = [
//     { header: "Position", key: "position", width: 10 },
//     { header: "Name", key: "name", width: 25 },
//     { header: "Total", key: "total", width: 10 },
//     { header: "Unrounded", key: "unroundedTotal", width: 12 },
//     ...disciplines.map((discipline) => ({
//       header: getDisciplineNameFromRef(discipline),
//       key: discipline,
//       width: 25,
//     })),
//   ];

//   // Add rows with data
//   data.forEach((row, index) => {
//     const processedRow = {
//       position: index + 1,
//       name: row.name,
//       total: row.total,
//       unroundedTotal: row.unroundedTotal,
//       // Assuming each discipline is nested, and you want the 'champ' property from each discipline
//       ...disciplines.reduce((acc, discipline) => {
//         acc[discipline] = row[discipline]?.champ || ""; // Add 'champ' value or empty string
//         return acc;
//       }, {}),
//     };

//     // // Calculate highest total for this row for all disciplines that include the text "SC" in their key
//     // if (disciplines.some((discipline) => discipline.includes("SC"))) {
//     //   const highestTotal = Math.max(
//     //     ...disciplines
//     //       .filter((discipline) => discipline.includes("SC"))
//     //       .map((discipline) => processedRow[champ])
//     //   );

//     const excelRow = worksheet.addRow(processedRow);

//     // Alternate row styling
//     if (index % 2 === 0) {
//       excelRow.fill = {
//         type: "pattern",
//         pattern: "solid",
//         fgColor: { argb: "F2F2F2" }, // Light grey row background
//       };
//     }

//     // Apply alternate styling specifically for column 3 (Champs points)
//     const cell = excelRow.getCell(3); // Column 3 cell
//     if (index % 2 === 0) {
//       cell.fill = {
//         type: "pattern",
//         pattern: "solid",
//         fgColor: { argb: "66CC00" }, // Slightly darker green for even rows
//       };
//     } else {
//       cell.fill = {
//         type: "pattern",
//         pattern: "solid",
//         fgColor: { argb: "77FF00" }, // Lighter green for odd rows
//       };
//     }
//   });

//   worksheet.eachRow((row, rowIndex) => {
//     let highestSCValue = -Infinity;
//     let highestKValue = -Infinity;
//     let highestSCCell = null;
//     let highestKCell = null;

//     // Iterate over each cell in the row
//     row.eachCell((cell, colNumber) => {
//       const columnKey = worksheet.getColumn(colNumber).key;
//       const cellValue = parseFloat(cell.value); // Convert to a number

//       // For "SC" columns
//       if (columnKey.includes("SC")) {
//         if (!isNaN(cellValue) && cellValue > highestSCValue) {
//           highestSCValue = cellValue;
//           highestSCCell = cell; // Track the cell with the highest SC value
//         }
//       }

//       // For "K" columns
//       if (columnKey.includes("K")) {
//         if (!isNaN(cellValue) && cellValue > highestKValue) {
//           highestKValue = cellValue;
//           highestKCell = cell; // Track the cell with the highest K value
//         }
//       }
//     });

//     // Define the alternating row fill colors
//     const lightOrange = "FF7700";
//     const darkOrange = "CC6200";

//     const fillColor = rowIndex % 2 === 0 ? lightOrange : darkOrange;

//     // Highlight the highest SC cell
//     if (highestSCCell) {
//       highestSCCell.fill = {
//         type: "pattern",
//         pattern: "solid",
//         fgColor: { argb: fillColor }, // Alternating orange fill
//       };
//       highestSCCell.font = { bold: true }; // Optionally make the text bold
//     }

//     // Highlight the highest K cell
//     if (highestKCell) {
//       highestKCell.fill = {
//         type: "pattern",
//         pattern: "solid",
//         fgColor: { argb: fillColor }, // Alternating orange fill
//       };
//       highestKCell.font = { bold: true }; // Optionally make the text bold
//     }
//   });

//   // Add champ pts styling
//   worksheet.getColumn(3).font = { bold: true };

//   // Add header row styling
//   worksheet.getRow(1).font = { bold: true };
//   worksheet.getRow(1).fill = {
//     type: "pattern",
//     pattern: "solid",
//     fgColor: { argb: "FFFF00" }, // Yellow header background
//   };

//   //Disciplines tabs
//   disciplines.forEach((discipline) => {
//     const disciplineWorksheet = workbook.addWorksheet(
//       getDisciplineNameFromRef(discipline)
//     );
//     disciplineWorksheet.columns = [
//       { header: "Position", key: "position", width: 10 },
//       { header: "Name", key: "name", width: 25 },
//       { header: "Raw score", key: "raw", width: 20 },
//       discipline.includes("SC") && { header: "Time", key: "time", width: 20 },
//       { header: "Champ. pts", key: "total", width: 20 },
//     ];

//     const sortedDisciplineData = data
//       .map((row) => ({
//         name: row.name,
//         raw: row[discipline].raw || "",
//         time: discipline.includes("SC") ? row[discipline].time : "",
//         champ: row[discipline].champ || "", // Extract the 'champ' score for this discipline
//       }))
//       .sort((a, b) => b.champ - a.champ); // Sort by champ descending

//     // Add rows with data
//     sortedDisciplineData.forEach((row, index) => {
//       const processedRow = {
//         position: index + 1,
//         name: row.name,
//         raw: row.raw,
//         time: row.time,
//         total: row.champ,
//       };

//       if (discipline.includes("SC")) {
//         processedRow.time = row[discipline]?.time || "";
//       }

//       const excelRow = disciplineWorksheet.addRow(processedRow);

//       // Alternate row styling
//       if (index % 2 === 0) {
//         excelRow.fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: { argb: "F2F2F2" }, // Light grey row background
//         };
//       }

//       // Apply alternate styling specifically for last column (Champs points)
//       const cell = excelRow.getCell(disciplineWorksheet.columnCount);
//       if (index % 2 === 0) {
//         cell.fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: { argb: "66CC00" }, // Slightly darker green for even rows
//         };
//       } else {
//         cell.fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: { argb: "77FF00" }, // Lighter green for odd rows
//         };
//       }
//     });

//     // Add champ pts styling
//     disciplineWorksheet.getColumn(disciplineWorksheet.columnCount).font = {
//       bold: true,
//     };

//     // Add header row styling
//     disciplineWorksheet.getRow(1).font = { bold: true };
//     disciplineWorksheet.getRow(1).fill = {
//       type: "pattern",
//       pattern: "solid",
//       fgColor: { argb: "FFFF00" }, // Yellow header background
//     };
//   });

//   // Write to a buffer
//   const buffer = await workbook.xlsx.writeBuffer();
//   const blob = new Blob([buffer], {
//     type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//   });
//   const url = URL.createObjectURL(blob);
//   const link = document.createElement("a");
//   link.href = url;
//   link.download = compTitle + " results.xlsx";
//   link.click();
//   URL.revokeObjectURL(url);
// };

export const fetchCurrentUserData = async (userId) => {
  try {
    const token = getToken();

    const configuration = {
      method: "get",
      url: `${backendUrl}/user/${userId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    // Use the user ID to fetch additional user data
    const result = await axios(configuration);
    return result.data;
  } catch (error) {
    console.error("Error fetching user data:", error);

    return null;
  }
};

export const generateToken = (length = 32) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    token += charset[randomIndex];
  }
  return token;
};

// List of countries from countries.csv
export const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "The Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "East Timor",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "England",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "The Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "North Korea",
  "South Korea",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Macedonia",
  "Northern Ireland",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Republic of the Congo",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Scotland",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Eswatini",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Wales",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];
