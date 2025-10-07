// Competition prefix mapping
const competitionPrefixes = {
  "Algerian Memory Championship": "ALG",
  "Australian Memory Championship": "AMC",
  "Austrian Open Memory Championship": "AOMC",
  "Arabian Open Memory Championship": "arbmc",
  "Asia Memory Championship": "ASIA",
  "Australian Open Memory Championship": "AUOMC",
  "Friendly (Cambridge) Memory Championship": "CAM",
  "IAM Canadian Open Memory Championship": "CAMC",
  "Chinese Memory Championship": "CMC",
  "Danish Open Memory Championship": "DANO",
  "Derby Memory Championship": "DER",
  "Egyptian Memory Championship": "EGMC",
  "IAM European Memory Championship": "EUMC",
  "French Open Memory Championship": "FOMC",
  "German Kids Memory Championship": "GCMC",
  "German Junior Memory Championship": "GJMC",
  "German Memory Championship": "GMC",
  "Gothenburg Memory Championship": "GMO",
  "German Open Memory Championship": "GOMC",
  "Hong Kong Open Memory Championship": "HKOMC",
  "Indonesia Open Memory Championship": "IDOMC",
  "Indian Memory Championship": "IMC",
  "Indonesia Memory Championship": "INMC",
  "Indian Open Memory Championship": "IOMC",
  "Italian Open Memory Championship": "ITOMC",
  "Jordan Memory Championship": "JNMC",
  "Korea National Memory Championship": "KRMC",
  "Korea Open Memory Championship": "KROMC",
  "Libyan Open Memory Championships": "LIB",
  "MAA US Open": "MAAUSO",
  "Moroccan Memory Championship": "MCO",
  "Mexican Memory Championship": "MMC",
  "Mongolian Memory Championship": "MON",
  "MSO Memory Championship": "MSO",
  "Malaysia Memory Championship": "MYMC",
  "Malaysia Open Memory Championship": "MYOMC",
  "North German Kids Memory Championship": "NGCMC",
  "North German Junior Memory Championship": "NGJMC",
  "North German Memory Championship": "NGMC",
  "North German Open Memory Championship": "NGOMC",
  "Norwegian Memory Championship": "NMC",
  "Polish Kids Memory Championship": "PCMC",
  "Philippines Friendly Memory Championship": "PFMC",
  "Philippine OPEN Champs": "PFOMC",
  "Philippine Memory Championships": "PhCMC",
  "Polish Junior Memory Championship": "PJMC",
  "Polish Memory Championship": "PMC",
  "Prague Open Memory Championship": "POMC",
  "Romanian Memory Championship": "RMC",
  "Speed Cards Challenge": "SCC",
  "South German Kids Memory Championship": "SGCMC",
  "South German Junior Memory Championship": "SGJMC",
  "South German Memory Championship": "SGMC",
  "Regional German Open Memory Championship": "SGOMC",
  "Singapore Open Memory Championship": "SINO",
  "Slovenian Memory Championship": "SLV",
  "Slovenian Open Regional Memory Championship": "SLVO",
  "Spanish Open Memory Championship": "SPOMC",
  "Sudanese Memory Championship": "SUMC",
  "Swedish Open Memory Championship": "SWE",
  "Tokyo Friendly Memory Championship": "TFMC",
  "Japan Open Memory Championship": "TFOMC",
  "Thailand Memory Championship": "TMC",
  "Tunisian Memory Championship": "TNMC",
  "Thailand Open Memory Championship": "TOMC",
  "Taiwan Open Memory Championship": "TWO",
  "Ukrainian Memory Championship": "UAMC",
  "UK Open Memory Championship": "UKO",
  "USA Memory Championship": "USA",
  "IAM US Open": "USO",
  "Welsh Open Memory Championship": "WLO",
  "World Memory Championship": "WMC",
  "Peak IAM European Open Memory Championship": "EUOMC",
  "Memory World Cup": "MWC",
  "Mongolian National Memory Championship": "MONN",
  "World Memory Tour Macau": "MOHK",
  "MemoryXL Open": "MXLO",
  "German MemoryXL Open": "GMXLO",
  "Regional German Memory Championships": "RGMC",
  "Regional German Junior Memory Championships": "RGJMC",
  "Regional German Kids Memory Championships": "RGKMC",
};

// Function to generate comp_id
export const generateCompId = (compName, startDate) => {
  if (!compName || !startDate) return "";

  // Find matching prefix
  let prefix = "";
  for (const [key, value] of Object.entries(competitionPrefixes)) {
    if (
      compName.toLowerCase().includes(
        key
          .toLowerCase()
          .replace(/%ordinal%|%year%/g, "")
          .trim()
      )
    ) {
      prefix = value;
      break;
    }
  }

  // If no match found, generate prefix from initials
  if (!prefix) {
    const words = compName.split(/\s+/).filter((word) => word.length > 0);
    const existingPrefixes = Object.values(competitionPrefixes).map((p) =>
      p.toLowerCase()
    );

    if (words.length === 1) {
      // Single word - use first 3 letters
      prefix = words[0].substring(0, 3).toUpperCase();
    } else {
      // Multiple words - start with initials (letters only)
      let candidatePrefix = words
        .filter((word) => /^[a-zA-Z]/.test(word)) // Only words that start with a letter
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase();

      // If it clashes, add extra letters from the first word
      let extraLetterIndex = 1;
      const firstWord = words.find((word) => /^[a-zA-Z]/.test(word)); // First word that starts with a letter
      while (
        existingPrefixes.includes(candidatePrefix.toLowerCase()) &&
        firstWord &&
        extraLetterIndex < firstWord.length
      ) {
        candidatePrefix =
          firstWord.substring(0, extraLetterIndex + 1).toUpperCase() +
          words
            .filter((word) => /^[a-zA-Z]/.test(word))
            .slice(1)
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase();
        extraLetterIndex++;
      }

      prefix = candidatePrefix;
    }
  }

  // Get last two digits of year
  const year = new Date(startDate).getFullYear().toString().slice(-2);

  return `${prefix}${year}`;
};
