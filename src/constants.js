export const nationalEvents = ["5N1", "5N2", "15N", "5F", "5W", "D", "SC", "10C", "5I", "5B", "K1", "K2", "K3"];

export const internationalEvents = ["5N1", "5N2", "30N", "15F", "15W", "D", "SC", "30C", "5I", "30B", "K1", "K2", "K3"];

export const worldEvents = ["5N1", "5N2", "60N", "15F", "15W", "D", "SC", "SXC", "60C", "5I", "30B", "K1", "K2", "K3"];

export const formatNames = { 'n': 'national', 'i': 'international', 'w': 'World Championship'}

export const disciplines = [
    {
        "ref": "5N1",
        "label": "5-minute Numbers Trial 1",
        "standard": 649
    },
    {
        "ref": "5N2",
        "label": "5-minute Numbers Trial 2",
        "standard": 649
    },
    {
        "ref": "15N",
        "label": "15-minute Numbers",
        "standard": 1385
    },
    {
        "ref": "30N",
        "label": "30-Minute Numbers",
        "standard": 2090
    },
    {
        "ref": "60N",
        "label": "Hour Numbers",
        "standard": 3234
    },
    {
        "ref": "5F",
        "label": "5-Minute Names & Faces",
        "standard": 95
    },
    {
        "ref": "15F",
        "label": "15-Minute Names & Faces",
        "standard": 210
    },
    {
        "ref": "5W",
        "label": "5-Minute Words",
        "standard": 153
    },
    {
        "ref": "15W",
        "label": "15-Minute Words",
        "standard": 312
    },

    {
        "ref": "K1",
        "label": "Spoken Numbers Attempt 1",
        "standard": 47.3
    },
    {
        "ref": "K2",
        "label": "Spoken Numbers Attempt 2",
        "standard": 47.3
    },
    {
        "ref": "K3",
        "label": "Spoken Numbers Attempt 3",
        "standard": 47.3
    },
    {
        "ref": "D",
        "label": "5-Minute Dates",
        "standard": 142
    },
    {
        "ref": "SC",
        "label": "Speed Cards",
        "standard": {part1: 6862, part2: 0.75, part3: 95.19}
    },
    {
        "ref": "10C",
        "label": "10-Minute Cards",
        "standard": 589
    },
    {
        "ref": "30C",
        "label": "30-Minute Cards",
        "standard": 1242
    },
    {
        "ref": "60C",
        "label": "Hour Cards",
        "standard": 1852
    },
    {
        "ref": "5I",
        "label": "5-Minute Images",
        "standard": 567
    },
    {
        "ref": "5B",
        "label": "5-Minute Binary",
        "standard": 1550
    },
    {
        "ref": "30B",
        "label": "30-Minute Binary",
        "standard": 6171
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

    return matchingDiscipline.standard;
  }


  export function getDisciplineRefFromName(disciplineName) {
    const matchingDiscipline = disciplines.find(
      (discipline) => discipline.label === disciplineName
    );
  
    return matchingDiscipline ? matchingDiscipline.ref : "Unknown Discipline";
  }