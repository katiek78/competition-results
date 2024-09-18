import axios from "axios";
import Cookies from "universal-cookie";
import { backendUrl } from "./constants";
import * as XLSX from "xlsx";

export const getToken = () => {
  const cookies = new Cookies();
  return cookies.get("TOKEN");
};

export const exportToExcel = (compTitle, data) => {
  // Create a new workbook and add a worksheet with the data
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  // worksheet["!cols"] = [
  //   { wpx: 200 }, // Name column width
  //   { wpx: 100 }, // Total column width
  //   { wpx: 150 }, // Unrounded Total column width
  //   ...data[0].entries.map(() => ({ wpx: 100 })) // Discipline columns widt
  // ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

  // Apply header formatting
  const header = worksheet["A1"];
  if (header) {
    header.s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "FFFF00" } }, // Yellow background
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
      },
    };
  }

  // Apply alternate row formatting
  Object.keys(worksheet).forEach((cellRef) => {
    if (cellRef[0] === "A" && cellRef[1] !== "1") {
      // Skip header row
      const rowNum = parseInt(cellRef.slice(1), 10);
      if (rowNum % 2 === 0) {
        worksheet[cellRef].s = {
          fill: { fgColor: { rgb: "F2F2F2" } }, // Light grey background
        };
      }
    }
  });

  // Generate a binary string
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "binary" });

  // Function to convert a string to an array buffer
  const s2ab = (s) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  };

  // Create a Blob and trigger the download
  const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = compTitle + " results.xlsx";
  link.click();
  URL.revokeObjectURL(url);
};

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
