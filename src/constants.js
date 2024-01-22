export const nationalEvents = ["5N1", "5N2", "15N", "5F", "5W", "D", "SC", "10C", "5I", "5B", "K1", "K2", "K3"];

export const internationalEvents = ["5N1", "5N2", "30N", "15F", "15W", "D", "SC", "30C", "5I", "30B", "K1", "K2", "K3"];

export const worldEvents = ["5N1", "5N2", "60N", "15F", "15W", "D", "SC", "SXC", "60C", "5I", "30B", "K1", "K2", "K3"];

export const formatNames = { 'n': 'national', 'i': 'international', 'w': 'World Championship'}

export const disciplines = [
    {
        "ref": "5N1",
        "label": "5-minute Numbers Trial 1",
    },
    {
        "ref": "5N2",
        "label": "5-minute Numbers Trial 2",
    },
    {
        "ref": "15N",
        "label": "15-minute Numbers",
    },
    {
        "ref": "30N",
        "label": "30-Minute Numbers",
    },
    {
        "ref": "60N",
        "label": "Hour Numbers",
    },
    {
        "ref": "5F",
        "label": "5-Minute Names & Faces",
    },
    {
        "ref": "15F",
        "label": "15-Minute Names & Faces",
    },
    {
        "ref": "5W",
        "label": "5-Minute Words",
    },
    {
        "ref": "15W",
        "label": "15-Minute Words",
    },

    {
        "ref": "K1",
        "label": "Spoken Numbers Attempt 1",
    },
    {
        "ref": "K2",
        "label": "Spoken Numbers Attempt 2",
    },
    {
        "ref": "K3",
        "label": "Spoken Numbers Attempt 3",
    },
    {
        "ref": "D",
        "label": "5-Minute Dates",
    },
    {
        "ref": "SC",
        "label": "Speed Cards",
    },
    {
        "ref": "10C",
        "label": "10-Minute Cards",
    },
    {
        "ref": "30C",
        "label": "30-Minute Cards",
    },
    {
        "ref": "60C",
        "label": "Hour Cards",
    },
    {
        "ref": "5I",
        "label": "5-Minute Images",
    },
    {
        "ref": "5B",
        "label": "5-Minute Binary",
    },
    {
        "ref": "30B",
        "label": "30-Minute Binary",
    },
];

export function getDisciplineNameFromRef(disciplineRef) {
    const matchingDiscipline = disciplines.find(
      (discipline) => discipline.ref === disciplineRef
    );
  
    return matchingDiscipline ? matchingDiscipline.label : "Unknown Discipline";
  }