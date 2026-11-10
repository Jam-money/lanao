import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAssessment, useSaveAssessment } from "@/hooks/useAssessment";
import { useApplicants } from "@/hooks/useApplicants";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, Save, Plus, Trash2 } from "lucide-react";

function Field({
  value,
  onChange,
  className,
  placeholder,
  type = "text",
  min,
  max,
  isSuperAdmin,
}: {
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
  isSuperAdmin: boolean;
}) {
  if (isSuperAdmin) {
    return (
      <Input
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className={className}
        placeholder={placeholder}
      />
    );
  }
  const display = value === 0 || value === "" ? "—" : String(value);
  return (
    <span className={`font-semibold uppercase ${className ?? ""}`}>
      {display}
    </span>
  );
}

type TrainingRow = { name: string; hours: number };
type ExperienceRow = { name: string; years: number; months: number };

export default function AssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const { isSuperAdmin } = useAuth();
  const { data: applicants } = useApplicants();
  const applicant = applicants?.find((a) => a.id === id);
  const { data: existing, isLoading } = useAssessment(id || "");
  const saveMut = useSaveAssessment();

  const [form, setForm] = useState({
    office_service_unit_region: "",
    division_province: "",
    division_province_current: "",
    salary_grade_input: "",
    education_degree: "", education_course: "", education_pts: 0,
    training_pts: 0,
    experience_pts: 0,
    eligibility_pts: 0,
  });

  const [trainingRows, setTrainingRows] = useState<TrainingRow[]>([{ name: "", hours: 0 }]);
  const [experienceRows, setExperienceRows] = useState<ExperienceRow[]>([{ name: "", years: 0, months: 0 }]);

  useEffect(() => {
    if (existing) {
      setForm({
        office_service_unit_region: existing.office_service_unit_region || "",
        division_province: existing.division_province || "",
        division_province_current: existing.division_province_current || "",
        salary_grade_input: existing.salary_grade_input || "",
        education_degree: existing.education_degree || "",
        education_course: existing.education_course || "",
        education_pts: Number(existing.education_pts) || 0,
        training_pts: Number(existing.training_pts) || 0,
        experience_pts: Number(existing.experience_pts) || 0,
        eligibility_pts: Number(existing.eligibility_pts) || 0,
      });

      if (existing.training_rows) {
        try { setTrainingRows(JSON.parse(existing.training_rows)); } catch { }
      } else if (existing.training_name) {
        setTrainingRows([{ name: existing.training_name, hours: Number(existing.training_hours) || 0 }]);
      }

      if (existing.experience_rows) {
        try { setExperienceRows(JSON.parse(existing.experience_rows)); } catch { }
      } else if (existing.experience_name) {
        setExperienceRows([{ name: existing.experience_name, years: Number(existing.experience_years) || 0, months: 0 }]);
      }
    }
  }, [existing]);

  const totalTrainingHours = useMemo(
    () => trainingRows.reduce((sum, r) => sum + (r.hours || 0), 0),
    [trainingRows]
  );

  const totalExperienceDisplay = useMemo(() => {
    const rawYears = experienceRows.reduce((sum, r) => sum + (r.years || 0), 0);
    const rawMonths = experienceRows.reduce((sum, r) => sum + (r.months || 0), 0);
    if (rawYears === 0 && rawMonths === 0) return "";
    const extraYears = Math.floor(rawMonths / 12);
    const remainingMonths = rawMonths % 12;
    const totalYears = rawYears + extraYears;
    if (remainingMonths === 0) return `${totalYears}`;
    return `${totalYears} yr${totalYears !== 1 ? "s" : ""} ${remainingMonths} mo${remainingMonths !== 1 ? "s" : ""}`;
  }, [experienceRows]);

  const total = useMemo(() =>
    Math.min(form.education_pts, 20) + Math.min(form.training_pts, 15) +
    Math.min(form.experience_pts, 15) + Math.min(form.eligibility_pts, 10),
    [form.education_pts, form.training_pts, form.experience_pts, form.eligibility_pts]
  );

  const setNum = (key: string, value: string, max: number) => {
    if (value === "") {
      setForm((p) => ({ ...p, [key]: 0 }));
    } else {
      const num = Math.min(Math.max(0, Number(value) || 0), max);
      setForm((p) => ({ ...p, [key]: num }));
    }
  };

  const updateTrainingRow = (index: number, field: keyof TrainingRow, value: string | number) => {
    setTrainingRows((rows) => rows.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };
  const addTrainingRow = () => setTrainingRows((rows) => [...rows, { name: "", hours: 0 }]);
  const removeTrainingRow = (index: number) => setTrainingRows((rows) => rows.filter((_, i) => i !== index));

  const updateExperienceRow = (index: number, field: keyof ExperienceRow, value: string | number) => {
    setExperienceRows((rows) => rows.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };
  const addExperienceRow = () => setExperienceRows((rows) => [...rows, { name: "", years: 0, months: 0 }]);
  const removeExperienceRow = (index: number) => setExperienceRows((rows) => rows.filter((_, i) => i !== index));

  const handleSave = () => {
    if (!id) return;
    saveMut.mutate({
      ...(existing?.id ? { id: existing.id } : {}),
      applicant_id: id,
      ...form,
      training_rows: JSON.stringify(trainingRows),
      training_name: trainingRows[0]?.name || "",
      training_hours: trainingRows[0]?.hours || 0,
      experience_rows: JSON.stringify(experienceRows),
      experience_name: experienceRows[0]?.name || "",
      experience_duration: experienceRows[0] ? `${experienceRows[0].years} years and ${experienceRows[0].months} months` : "",
      experience_years: experienceRows[0]?.years || 0,
      evaluated_by: existing?.evaluated_by || null,
      reviewed_by: existing?.reviewed_by || null,
      attested_by: existing?.attested_by || null,
      user_id: existing?.user_id || null,
    });
  };

  if (isLoading) return <AppLayout><p className="text-center py-8 text-muted-foreground">Loading...</p></AppLayout>;

  return (
    <AppLayout>
      <div className="mb-4 flex items-center gap-4 no-print">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/applicants"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
        {isSuperAdmin && (
          <Button size="sm" onClick={handleSave} disabled={saveMut.isPending}>
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        )}
      </div>

      <Card className="print-full-width overflow-hidden">
        <CardHeader className="text-center border-b pb-3">
          <p className="text-xs text-muted-foreground">PSA-HRMPSB Form 3</p>
          <CardTitle className="text-lg">Individual Assessment Form</CardTitle>
        </CardHeader>

        <CardContent className="p-0">

          <table className="w-full text-xs border-collapse border-b border-gray-300">
            <tbody>
              {/* ROW 1: Name of Applicant (left) | Eligibility (right) */}
              <tr>
                <td className="border border-gray-300 px-2 py-1 w-1/2">
                  <p className="text-[10px] text-muted-foreground">Name of Applicant: (Last, First and Middle Name)</p>
                  <p className="font-bold text-sm mt-0.5 uppercase">{applicant?.name || "—"}</p>
                </td>
                <td className="border border-gray-300 px-2 py-1 w-1/2">
                  <p className="text-[10px] text-muted-foreground">Eligibility:</p>
                  <p className="font-bold mt-0.5 uppercase">{applicant?.eligibility || "—"}</p>
                </td>
              </tr>
              {/* ROW 2: Contact Number (left) | Email Address (right) */}
              <tr>
                <td className="border border-gray-300 px-2 py-1">
                  <p className="text-[10px] text-muted-foreground">Contact Number:</p>
                  <p className="font-semibold mt-0.5">{applicant?.contact || "—"}</p>
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <p className="text-[10px] text-muted-foreground">Email Address:</p>
                  <p className="font-semibold mt-0.5">{applicant?.email || "—"}</p>
                </td>
              </tr>
              {/* ROW 3: Previous Position (left) | Position Applied For (right) */}
              <tr>
                <td className="border border-gray-300 px-2 py-1">
                  <p className="text-[10px] text-muted-foreground">Previous Position:</p>
                  <p className="font-semibold mt-0.5 uppercase">{applicant?.previous_position || "—"}</p>
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <p className="text-[10px] text-muted-foreground">Position Applied For:</p>
                  <p className="font-semibold mt-0.5 uppercase">{applicant?.position_applied || "—"}</p>
                </td>
              </tr>
              {/* ROW 4: Salary Grade input (left) | Salary Grade static (right) */}
              <tr>
                <td className="border border-gray-300 px-2 py-1">
                  <p className="text-[10px] text-muted-foreground">Salary Grade:</p>
                  <Field
                    isSuperAdmin={isSuperAdmin}
                    value={form.salary_grade_input}
                    onChange={(e) => setForm((p) => ({ ...p, salary_grade_input: e.target.value }))}
                    className="mt-0.5 h-7 text-xs"
                    placeholder="Enter salary grade"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <p className="text-[10px] text-muted-foreground">Salary Grade:</p>
                  <p className="font-semibold mt-0.5">{applicant?.salary_grade || "—"}</p>
                </td>
              </tr>
              {/* ROW 5: Office input (left) | Office/Service/Unit/Region static (right) */}
              <tr>
                <td className="border border-gray-300 px-2 py-1">
                  <p className="text-[10px] text-muted-foreground">Office:</p>
                  <Field
                    isSuperAdmin={isSuperAdmin}
                    value={form.office_service_unit_region}
                    onChange={(e) => setForm((p) => ({ ...p, office_service_unit_region: e.target.value }))}
                    className="mt-0.5 h-7 text-xs"
                    placeholder="Enter office/service/unit/region"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <p className="text-[10px] text-muted-foreground">Office/Service/Unit/Region:</p>
                  <p className="font-semibold mt-0.5 uppercase">{applicant?.office || "—"}</p>
                </td>
              </tr>
              {/* ROW 6: Division/Province input (left) | Division/Province current (right) */}
              <tr>
                <td className="border border-gray-300 px-2 py-1">
                  <p className="text-[10px] text-muted-foreground">Division/Province:</p>
                  <Field
                    isSuperAdmin={isSuperAdmin}
                    value={form.division_province}
                    onChange={(e) => setForm((p) => ({ ...p, division_province: e.target.value }))}
                    className="mt-0.5 h-7 text-xs"
                    placeholder="Enter division/province"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <p className="text-[10px] text-muted-foreground">Division/Province:</p>
                  <Field
                    isSuperAdmin={isSuperAdmin}
                    value={form.division_province_current}
                    onChange={(e) => setForm((p) => ({ ...p, division_province_current: e.target.value }))}
                    className="mt-0.5 h-7 text-xs"
                    placeholder="Enter division/province"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-bold uppercase">Qualification Standards</p>
            <p className="text-[10px] text-muted-foreground italic">(To be accomplished by HRMPSB Member)</p>
          </div>

          <div className="px-4 pb-6">
            <table className="w-full text-xs mt-3 border-collapse">
              <thead>
                <tr>
                  <th className="text-left w-full"></th>
                  <th className="text-center text-[10px] font-semibold pb-1 px-4 whitespace-nowrap border-b border-foreground">
                    Maximum<br />Points
                  </th>
                  <th className="text-center text-[10px] font-semibold pb-1 px-4 whitespace-nowrap border-b border-foreground">
                    Points<br />Obtained
                  </th>
                </tr>
              </thead>
              <tbody>

                {/* I. Education */}
                <tr>
                  <td className="pt-4 pb-1 align-top">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold shrink-0">I.&nbsp;&nbsp;Education</span>
                      <div className="flex-1 border-b border-dashed border-gray-400"></div>
                    </div>
                    <div className="mt-2 space-y-2 pl-6">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground shrink-0 w-32">Highest Degree</span>
                        <Field
                          isSuperAdmin={isSuperAdmin}
                          value={form.education_degree}
                          onChange={(e) => setForm((p) => ({ ...p, education_degree: e.target.value }))}
                          className="h-5 text-xs border-0 border-b rounded-none px-0 bg-transparent focus-visible:ring-0 font-semibold uppercase"
                          placeholder="e.g. Doctorate"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground shrink-0 w-32">Course</span>
                        <Field
                          isSuperAdmin={isSuperAdmin}
                          value={form.education_course}
                          onChange={(e) => setForm((p) => ({ ...p, education_course: e.target.value }))}
                          className="h-5 text-xs border-0 border-b rounded-none px-0 bg-transparent focus-visible:ring-0 font-semibold uppercase"
                          placeholder="e.g. Bachelor of Science in..."
                        />
                      </div>
                    </div>
                  </td>
                  <td className="pt-4 text-center align-top font-semibold px-4">20</td>
                  <td className="pt-4 text-center align-top px-4">
                    <Field
                      isSuperAdmin={isSuperAdmin}
                      type="number" min={0} max={20}
                      value={form.education_pts === 0 ? "" : form.education_pts}
                      onChange={(e) => setNum("education_pts", e.target.value, 20)}
                      className="h-6 w-14 text-xs text-center font-bold mx-auto [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                </tr>

                {/* II. Relevant Training */}
                <tr>
                  <td className="pt-4 pb-1 align-top">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold shrink-0">II.&nbsp;&nbsp;Relevant Training</span>
                      <div className="flex-1 border-b border-dashed border-gray-400"></div>
                    </div>
                    <div className="mt-2 pl-6 space-y-2">
                      {trainingRows.map((row, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground shrink-0 w-32">Training/Seminar</span>
                            {isSuperAdmin ? (
                              <Input
                                value={row.name}
                                onChange={(e) => updateTrainingRow(i, "name", e.target.value)}
                                className="h-5 text-xs border-0 border-b rounded-none px-0 bg-transparent focus-visible:ring-0 font-semibold"
                                placeholder="e.g. Clinical Legal Education..."
                              />
                            ) : (
                              <span className="font-semibold">{row.name || "—"}</span>
                            )}
                            {isSuperAdmin && trainingRows.length > 1 && (
                              <button
                                onClick={() => removeTrainingRow(i)}
                                className="text-destructive hover:text-destructive/80 shrink-0 ml-1"
                                title="Remove row"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground shrink-0 w-32">No. of hours</span>
                            {isSuperAdmin ? (
                              <Input
                                type="number" min={0}
                                value={row.hours === 0 ? "" : row.hours}
                                onChange={(e) => updateTrainingRow(i, "hours", Number(e.target.value) || 0)}
                                className="h-5 w-20 text-xs border-0 border-b rounded-none px-0 bg-transparent focus-visible:ring-0 font-semibold [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            ) : (
                              <span className="font-semibold">{row.hours || "—"}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-1">
                        {isSuperAdmin && (
                          <button
                            onClick={addTrainingRow}
                            className="flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium"
                            title="Add training row"
                          >
                            <Plus className="h-3 w-3" /> Add Row
                          </button>
                        )}
                        <span className="text-muted-foreground ml-auto shrink-0">Total no. of hours:</span>
                        <span className="font-semibold underline ml-1">{totalTrainingHours || ""}</span>
                      </div>
                    </div>
                  </td>
                  <td className="pt-4 text-center align-top font-semibold px-4">15</td>
                  <td className="pt-4 text-center align-top px-4">
                    <Field
                      isSuperAdmin={isSuperAdmin}
                      type="number" min={0} max={15}
                      value={form.training_pts === 0 ? "" : form.training_pts}
                      onChange={(e) => setNum("training_pts", e.target.value, 15)}
                      className="h-6 w-14 text-xs text-center font-bold mx-auto [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                </tr>

                {/* III. Relevant Work Experience */}
                <tr>
                  <td className="pt-4 pb-1 align-top">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold shrink-0">III.&nbsp;&nbsp;Relevant Work Experience</span>
                      <div className="flex-1 border-b border-dashed border-gray-400"></div>
                    </div>
                    <div className="mt-2 pl-6 space-y-2">
                      {experienceRows.map((row, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground shrink-0 w-32">Work Experience</span>
                            {isSuperAdmin ? (
                              <Input
                                value={row.name}
                                onChange={(e) => updateExperienceRow(i, "name", e.target.value)}
                                className="h-5 text-xs border-0 border-b rounded-none px-0 bg-transparent focus-visible:ring-0 font-semibold"
                                placeholder="e.g. Compliance Officer"
                              />
                            ) : (
                              <span className="font-semibold">{row.name || "—"}</span>
                            )}
                            {isSuperAdmin && experienceRows.length > 1 && (
                              <button
                                onClick={() => removeExperienceRow(i)}
                                className="text-destructive hover:text-destructive/80 shrink-0 ml-1"
                                title="Remove row"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground shrink-0 w-32">No. of years</span>
                            {isSuperAdmin ? (
                              <>
                                <Input
                                  type="number" min={0}
                                  value={row.years === 0 ? "" : row.years}
                                  onChange={(e) => updateExperienceRow(i, "years", Number(e.target.value) || 0)}
                                  className="h-5 w-12 text-xs border-0 border-b rounded-none px-0 bg-transparent focus-visible:ring-0 font-semibold [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="yrs"
                                />
                                <span className="text-muted-foreground shrink-0 text-[10px]">yrs</span>
                                <Input
                                  type="number" min={0} max={11}
                                  value={row.months === 0 ? "" : row.months}
                                  onChange={(e) => updateExperienceRow(i, "months", Math.min(11, Number(e.target.value) || 0))}
                                  className="h-5 w-12 text-xs border-0 border-b rounded-none px-0 bg-transparent focus-visible:ring-0 font-semibold [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="mos"
                                />
                                <span className="text-muted-foreground shrink-0 text-[10px]">mos</span>
                              </>
                            ) : (
                              <span className="font-semibold">
                                {row.years > 0 || row.months > 0
                                  ? `${row.years} year${row.years !== 1 ? "s" : ""}${row.months > 0 ? ` and ${row.months} month${row.months !== 1 ? "s" : ""}` : ""}`
                                  : "—"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-1">
                        {isSuperAdmin && (
                          <button
                            onClick={addExperienceRow}
                            className="flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium"
                            title="Add experience row"
                          >
                            <Plus className="h-3 w-3" /> Add Row
                          </button>
                        )}
                        <span className="text-muted-foreground ml-auto shrink-0">Total no. of years:</span>
                        <span className="font-semibold underline ml-1">{totalExperienceDisplay}</span>
                      </div>
                    </div>
                  </td>
                  <td className="pt-4 text-center align-top font-semibold px-4">15</td>
                  <td className="pt-4 text-center align-top px-4">
                    <Field
                      isSuperAdmin={isSuperAdmin}
                      type="number" min={0} max={15}
                      value={form.experience_pts === 0 ? "" : form.experience_pts}
                      onChange={(e) => setNum("experience_pts", e.target.value, 15)}
                      className="h-6 w-14 text-xs text-center font-bold mx-auto [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                </tr>

                {/* IV. Eligibility */}
                <tr>
                  <td className="pt-4 pb-1 align-top">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold shrink-0">IV.&nbsp;&nbsp;Eligibility</span>
                      <div className="flex-1 border-b border-dashed border-gray-400"></div>
                    </div>
                  </td>
                  <td className="pt-4 text-center align-top font-semibold px-4">10</td>
                  <td className="pt-4 text-center align-top px-4">
                    <Field
                      isSuperAdmin={isSuperAdmin}
                      type="number" min={0} max={10}
                      value={form.eligibility_pts === 0 ? "" : form.eligibility_pts}
                      onChange={(e) => setNum("eligibility_pts", e.target.value, 10)}
                      className="h-6 w-14 text-xs text-center font-bold mx-auto [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                </tr>

                {/* TOTAL */}
                <tr className="border-t-2 border-foreground">
                  <td className="pt-2 align-middle">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm shrink-0">TOTAL</span>
                      <div className="flex-1 border-b border-dashed border-gray-400"></div>
                    </div>
                  </td>
                  <td className="pt-2 text-center font-bold text-sm px-4">60</td>
                  <td className="pt-2 text-center font-bold text-sm px-4 text-primary">{total}</td>
                </tr>

              </tbody>
            </table>
          </div>

        </CardContent>
      </Card>
    </AppLayout>
  );
}