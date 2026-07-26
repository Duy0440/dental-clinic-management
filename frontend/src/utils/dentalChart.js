const FDI_TEETH = new Set([
  "18", "17", "16", "15", "14", "13", "12", "11",
  "21", "22", "23", "24", "25", "26", "27", "28",
  "48", "47", "46", "45", "44", "43", "42", "41",
  "31", "32", "33", "34", "35", "36", "37", "38",
]);

const CONDITION_CODES = new Set([
  "normal",
  "caries",
  "filled",
  "root_canal",
  "crown",
  "implant",
  "missing",
  "extraction_indicated",
  "impacted",
  "periodontal_issue",
  "other",
]);

export const normalizeDentalChartEntry = (entry) => {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const toothNumber = String(
    entry.tooth_number ?? entry.toothNumber ?? entry.number ?? "",
  );

  if (!FDI_TEETH.has(toothNumber)) {
    return null;
  }

  const rawCondition =
    entry.condition_code ?? entry.conditionCode ?? entry.condition ?? "normal";
  const conditionCode = CONDITION_CODES.has(rawCondition)
    ? rawCondition
    : "other";

  return {
    tooth_number: toothNumber,
    condition_code: conditionCode,
    treatment_note: String(
      entry.treatment_note ??
        entry.treatmentNote ??
        entry.treatment ??
        entry.action ??
        "",
    ),
    note: String(entry.note ?? ""),
  };
};

export const normalizeDentalChartEntries = (entries) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  const uniqueEntries = new Map();

  entries
    .map(normalizeDentalChartEntry)
    .filter(Boolean)
    .forEach((entry) => {
      uniqueEntries.set(entry.tooth_number, entry);
    });

  return Array.from(uniqueEntries.values()).sort(
    (firstEntry, secondEntry) =>
      Number(firstEntry.tooth_number) - Number(secondEntry.tooth_number),
  );
};

export const extractMedicalRecordTeeth = (record) => {
  return normalizeDentalChartEntries(
    record?.teeth ?? record?.dental_chart ?? record?.dental_chart_entries ?? [],
  );
};

export const hasMarkedDentalEntries = (entries) => {
  return entries.some(
    (entry) =>
      entry.condition_code !== "normal" || entry.treatment_note || entry.note,
  );
};
