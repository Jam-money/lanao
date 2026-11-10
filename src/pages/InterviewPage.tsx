import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useInterview, useSaveInterview } from "@/hooks/useInterview";
import { useAssessment } from "@/hooks/useAssessment";
import { useApplicants } from "@/hooks/useApplicants";
import { COMPETENCIES, RATING_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Printer, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: applicants } = useApplicants();
  const applicant = applicants?.find((a) => a.id === id);
  const { data: assessment } = useAssessment(id || "");
  const { data: existing, isLoading } = useInterview(id || "");
  const saveMut = useSaveInterview();

  const [scores, setScores] = useState<Record<string, number>>({
    c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, c6: 0, c7: 0, c8: 0, c9: 0, c10: 0,
  });

  const { user } = useAuth();
  const draftKey = `interview-draft:${user?.id}:${id}`;

  const saved = useMemo<Record<string, number>>(() => existing ? {
    c1: existing.c1, c2: existing.c2, c3: existing.c3, c4: existing.c4, c5: existing.c5,
    c6: existing.c6, c7: existing.c7, c8: existing.c8, c9: existing.c9, c10: existing.c10,
  } : { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, c6: 0, c7: 0, c8: 0, c9: 0, c10: 0 }, [existing]);

  const [restored, setRestored] = useState(false);

  useEffect(() => {
    setScores(saved);
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (JSON.stringify(draft) !== JSON.stringify(saved)) {
          setScores(draft);
          setRestored(true);
          toast.info("Restored your unsaved ratings. Click Save to keep them.");
        } else localStorage.removeItem(draftKey);
      }
    } catch { /* ignore bad draft */ }
  }, [saved, draftKey]);

  const isDirty = useMemo(
    () => Object.keys(saved).some((k) => saved[k] !== scores[k]),
    [saved, scores]
  );

  useEffect(() => {
    if (isDirty) localStorage.setItem(draftKey, JSON.stringify(scores));
  }, [isDirty, scores, draftKey]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const total = useMemo(() =>
    Object.values(scores).reduce((s, v) => s + v, 0),
    [scores]
  );

  const unrated = Object.values(scores).filter((v) => !v).length;

  const handleSave = () => {
    if (!id) return;
    if (unrated > 0 && !window.confirm(`${unrated} competenc${unrated === 1 ? "y is" : "ies are"} not rated yet. Save anyway?`)) return;
    saveMut.mutate({
      ...(existing?.id ? { id: existing.id } : {}),
      applicant_id: id,
      ...scores as {
        c1: number; c2: number; c3: number; c4: number; c5: number;
        c6: number; c7: number; c8: number; c9: number; c10: number;
      },
    }, { onSuccess: () => { localStorage.removeItem(draftKey); setRestored(false); } });
  };

  if (isLoading) return (
    <AppLayout><p className="text-center py-8 text-muted-foreground">Loading...</p></AppLayout>
  );

  const leftSalaryGrade  = assessment?.salary_grade_input         || "N/A";
  const rightSalaryGrade = applicant?.salary_grade                || "N/A";
  const leftOffice       = assessment?.office_service_unit_region || "N/A";
  const rightOffice      = applicant?.office                      || "N/A";
  const leftDivision     = assessment?.division_province          || "N/A";
  const rightDivision    = assessment?.division_province_current  || "N/A";

  const groups = ["A. Core Competencies", "B. Leadership Competencies", "C. Technical Competencies"];

  // Reusable cell style — solid border like the printed form
  const cell = "border border-gray-800 px-3 py-1.5 text-xs";

  return (
    <AppLayout>
      <div className="mb-4 flex items-center gap-4 no-print">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/applicants"
            onClick={(e) => {
              if (isDirty && !window.confirm("You have unsaved ratings. Leave without saving?")) e.preventDefault();
            }}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
        <div className="flex-1" />
        {isDirty && (
          <span className="text-xs font-medium text-amber-600">
            {restored ? "Unsaved (restored draft)" : "Unsaved changes"}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saveMut.isPending}>
          <Save className="h-4 w-4 mr-1" /> Save
        </Button>
      </div>

      <Card className="print-full-width overflow-hidden">
        <CardHeader className="text-center border-b pb-3">
          <p className="text-xs text-muted-foreground">PSA-HRMPSB Form 4</p>
          <CardTitle className="text-lg">Competency Based Interview Form</CardTitle>
        </CardHeader>

        <CardContent className="p-0">

          {/* ── Header info table with solid visible borders ── */}
          <table className="w-full text-xs border-collapse">
            <tbody>

              {/* Row 1: Name — full width */}
              <tr>
                <td colSpan={2} className={cell}>
                  <span className="text-muted-foreground">Name of Applicant: </span>
                  <span className="text-[10px] italic text-muted-foreground">(Last, First and Middle Name)</span>
                  <p className="font-bold text-sm mt-0.5 uppercase">{applicant?.name || "—"}</p>
                </td>
              </tr>

              {/* Row 2: Eligibility — full width, inline */}
              <tr>
                <td colSpan={2} className={cell}>
                  <span className="text-muted-foreground font-medium">Eligibility: </span>
                  <span className="font-bold uppercase">{applicant?.eligibility || "—"}</span>
                </td>
              </tr>

              {/* Row 3: Contact | Email */}
              <tr>
                <td className={`${cell} w-1/2`}>
                  <span className="text-muted-foreground">Contact Number: </span>
                  <span className="font-bold">{applicant?.contact || "N/A"}</span>
                </td>
                <td className={`${cell} w-1/2`}>
                  <p className="text-muted-foreground">Email Address:</p>
                  <p className="font-bold">{applicant?.email || "N/A"}</p>
                </td>
              </tr>

              {/* Row 4: Previous Position | Position Applied For */}
              <tr>
                <td className={cell}>
                  <span className="text-muted-foreground">Previous Position: </span>
                  <span className="font-bold uppercase">{applicant?.previous_position || "N/A"}</span>
                </td>
                <td className={cell}>
                  <span className="text-muted-foreground">Position Applied For: </span>
                  <span className="font-bold uppercase">{applicant?.position_applied || "N/A"}</span>
                </td>
              </tr>

              {/* Row 5: Salary Grade | Salary Grade */}
              <tr>
                <td className={cell}>
                  <span className="text-muted-foreground">Salary Grade: </span>
                  <span className="font-bold">{leftSalaryGrade}</span>
                </td>
                <td className={cell}>
                  <span className="text-muted-foreground">Salary Grade: </span>
                  <span className="font-bold">{rightSalaryGrade}</span>
                </td>
              </tr>

              {/* Row 6: Office | Office/Service/Unit/Region */}
              <tr>
                <td className={cell}>
                  <span className="text-muted-foreground">Office: </span>
                  <span className="font-bold uppercase">{leftOffice}</span>
                </td>
                <td className={cell}>
                  <span className="text-muted-foreground">Office/Service/Unit/Region: </span>
                  <span className="font-bold uppercase">{rightOffice}</span>
                </td>
              </tr>

              {/* Row 7: Division/Province | Division/Province */}
              <tr>
                <td className={cell}>
                  <span className="text-muted-foreground">Division/Province: </span>
                  <span className="font-bold uppercase">{leftDivision}</span>
                </td>
                <td className={cell}>
                  <span className="text-muted-foreground">Division/Province: </span>
                  <span className="font-bold uppercase">{rightDivision}</span>
                </td>
              </tr>

            </tbody>
          </table>

          {/* ── Competency Sections ── */}
          <div className="px-4 pt-4 pb-6 space-y-6">
            {groups.map((group) => (
              <section key={group}>
                <h3 className="font-semibold text-sm border-b pb-1 mb-3">{group} (4% each)</h3>
                <div className="space-y-4">
                  {COMPETENCIES.filter((c) => c.group === group).map((comp) => (
                    <div
                      key={comp.key}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{comp.label}</p>
                      </div>
                      <RadioGroup
                        value={String(scores[comp.key] || 0)}
                        onValueChange={(v) => setScores((p) => ({ ...p, [comp.key]: Number(v) }))}
                        className="flex gap-3"
                      >
                        {[1, 2, 3, 4].map((val) => (
                          <div key={val} className="flex items-center gap-1">
                            <RadioGroupItem value={String(val)} id={`${comp.key}-${val}`} />
                            <Label htmlFor={`${comp.key}-${val}`} className="text-xs cursor-pointer">
                              {val} - {RATING_LABELS[val]}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Total */}
            <div className="bg-secondary rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">TOTAL (Part II)</p>
              <p className="text-3xl font-bold text-primary">
                {total} <span className="text-base font-normal text-muted-foreground">/ 40</span>
              </p>
            </div>
          </div>

        </CardContent>
      </Card>
    </AppLayout>
  );
}
