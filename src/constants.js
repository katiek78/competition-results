// Age group year cutoffs (estimated)
export const AGE_GROUPS = {
  kids: { minAge: 0, maxAge: 12 },
  juniors: { minAge: 13, maxAge: 17 },
  adults: { minAge: 18, maxAge: 59 },
  seniors: { minAge: 60, maxAge: 150 },
};

export const backendUrl = process.env.REACT_APP_BACKEND_URL;
export const frontendUrl = process.env.REACT_APP_FRONTEND_URL;

export const duplicateEmailMessage =
  "Email already exists. Please try again with a different email.";

export const nationalEvents = [
  "5N1",
  "5N2",
  "15N",
  "5F",
  "5W",
  "D",
  "SC1",
  "SC2",
  "10C",
  "5I",
  "5B",
  "K1",
  "K2",
  "K3",
];

export const internationalEvents = [
  "5N1",
  "5N2",
  "30N",
  "15F",
  "15W",
  "D",
  "SC1",
  "SC2",
  "30C",
  "5I",
  "30B",
  "K1",
  "K2",
  "K3",
];

export const worldEvents = [
  "5N1",
  "5N2",
  "60N",
  "15F",
  "15W",
  "D",
  "SC1",
  "SC2",
  "60C",
  "5I",
  "30B",
  "K1",
  "K2",
  "K3",
];

export const formatNames = {
  n: "national",
  i: "international",
  w: "World Championship",
};

export const NUMBER_OF_JPGS = 466;
export const NUMBER_OF_PNGS = 5894;

export const disciplines = [
  {
    ref: "5N1",
    label: "5-minute Numbers Trial 1",
    standard: 649,
    amount: 760,
  },
  {
    ref: "5N2",
    label: "5-minute Numbers Trial 2",
    standard: 649,
    amount: 760,
  },
  {
    ref: "15N",
    label: "15-minute Numbers",
    standard: 1385,
    amount: 1560,
  },
  {
    ref: "30N",
    label: "30-minute Numbers",
    standard: 2090,
    amount: 2360,
  },
  {
    ref: "60N",
    label: "Hour Numbers",
    standard: 3234,
    amount: 4120,
  },
  {
    ref: "5F",
    label: "5-minute Names & Faces",
    standard: 95,
    amount: 126,
  },
  {
    ref: "15F",
    label: "15-minute Names & Faces",
    standard: 210,
    amount: 270,
  },
  {
    ref: "5W",
    label: "5-minute Words",
    standard: 153,
    amount: 174,
  },
  {
    ref: "15W",
    label: "15-minute Words",
    standard: 312,
    amount: 382,
  },

  {
    ref: "K1",
    label: "Spoken Numbers Attempt 1",
    standard: 47.3,
    amount: 200,
  },
  {
    ref: "K2",
    label: "Spoken Numbers Attempt 2",
    standard: 47.3,
    amount: 300,
  },
  {
    ref: "K3",
    label: "Spoken Numbers Attempt 3",
    standard: 47.3,
    amount: 550,
  },
  {
    ref: "D",
    label: "5-minute Dates",
    standard: 142,
    amount: 178,
  },
  {
    ref: "SC1",
    label: "Speed Cards Trial 1",
    standard: { part1: 6862, part2: 0.75, part3: 95.19 },
    amount: 1,
  },
  {
    ref: "SC2",
    label: "Speed Cards Trial 2",
    standard: { part1: 6862, part2: 0.75, part3: 95.19 },
    amount: 1,
  },
  {
    ref: "10C",
    label: "10-minute Cards",
    standard: 589,
    amount: 13,
  },
  {
    ref: "30C",
    label: "30-minute Cards",
    standard: 1242,
    amount: 28,
  },
  {
    ref: "60C",
    label: "Hour Cards",
    standard: 1852,
    amount: 43,
  },
  {
    ref: "5I",
    label: "Images",
    standard: 679,
    amount: 930,
  },
  {
    ref: "5B",
    label: "5-minute Binary",
    standard: 1550,
    amount: 1530,
  },
  {
    ref: "30B",
    label: "30-minute Binary",
    standard: 6171,
    amount: 7530,
  },
];

export function getDisciplineNameFromRef(disciplineRef) {
  const matchingDiscipline = disciplines.find(
    (discipline) => discipline.ref === disciplineRef
  );

  return matchingDiscipline ? matchingDiscipline.label : "Unknown Discipline";
}

export function getDisciplineStandardFromRef(disciplineRef) {
  const matchingDiscipline = disciplines.find(
    (discipline) => discipline.ref === disciplineRef
  );

  return matchingDiscipline?.standard || null;
}

export function getDisciplineRefFromName(disciplineName) {
  const matchingDiscipline = disciplines.find(
    (discipline) =>
      discipline.label.toLowerCase() === disciplineName.toLowerCase()
  );

  return matchingDiscipline ? matchingDiscipline.ref : "Unknown Discipline";
}
