export const COMPETENCIES = [
  { key: "c1", label: "Exemplifying Integrity", group: "A. Core Competencies" },
  { key: "c2", label: "Results Orientation", group: "A. Core Competencies" },
  { key: "c3", label: "Quality Service Orientation", group: "A. Core Competencies" },
  { key: "c4", label: "Teamwork and Developing Partnerships", group: "A. Core Competencies" },
  { key: "c5", label: "Planning Organizing and Delivery", group: "B. Leadership Competencies" },
  { key: "c6", label: "Strategic and Creative Thinking", group: "B. Leadership Competencies" },
  { key: "c7", label: "Application of technical knowledge and skills", group: "B. Leadership Competencies" },
  { key: "c8", label: "Communication Skills", group: "C. Technical Competencies" },
  { key: "c9", label: "Computer skills", group: "C. Technical Competencies" },
  { key: "c10", label: "Data Management", group: "C. Technical Competencies" },
] as const;

export const RATING_LABELS: Record<number, string> = {
  4: "Advanced",
  3: "Intermediate",
  2: "Basic",
  1: "Below Basic",
};