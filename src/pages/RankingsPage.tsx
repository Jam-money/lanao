import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Printer, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Applicant = {
  id: string;
  name: string;
  position_applied: string | null;
  salary_grade: string | null;
  office: string | null;
  eligibility: string | null;
  vacant_positions: string | null;
};

type RankedApplicant = Applicant & {
  education_pts: number | null;
  training_pts: number | null;
  experience_pts: number | null;
  eligibility_pts: number | null;
  part1_total: number | null;
  c1: number | null; c2: number | null; c3: number | null; c4: number | null; c5: number | null;
  c6: number | null; c7: number | null; c8: number | null; c9: number | null; c10: number | null;
  part2_total: number | null;
  grand_total: number | null;
  complete: boolean;
  rater_count_assess: number;
  rater_count_inter: number;
  status?: string | null;
};

function useRankings() {
  const { officeId } = useAuth();
  return useQuery({
    queryKey: ["rankings", officeId],
    queryFn: async () => {
      const { data: applicants, error: e1 } = await supabase
        .from("applicants")
        .select("id, name, position_applied, salary_grade, office, eligibility, vacant_positions, status")
        .eq("office_id", officeId);
      if (e1) throw e1;

      const { data: assessments, error: e2 } = await supabase
        .from("assessments")
        .select("applicant_id, education_pts, training_pts, experience_pts, eligibility_pts, user_id")
        .eq("office_id", officeId);
      if (e2) throw e2;

      const { data: interviews, error: e3 } = await supabase
        .from("interviews")
        .select("applicant_id, c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, user_id")
        .eq("office_id", officeId);
      if (e3) throw e3;

      const assessGroups = new Map<string, typeof assessments>();
      for (const a of assessments ?? []) {
        if (!assessGroups.has(a.applicant_id)) assessGroups.set(a.applicant_id, []);
        assessGroups.get(a.applicant_id)!.push(a);
      }
      const assessAvg = new Map<string, {
        education_pts: number; training_pts: number;
        experience_pts: number; eligibility_pts: number;
        count: number;
      }>();
      for (const [appId, rows] of assessGroups) {
        const count = rows.length;
        assessAvg.set(appId, {
          education_pts:   rows.reduce((s, r) => s + (Number(r.education_pts)   || 0), 0) / count,
          training_pts:    rows.reduce((s, r) => s + (Number(r.training_pts)    || 0), 0) / count,
          experience_pts:  rows.reduce((s, r) => s + (Number(r.experience_pts)  || 0), 0) / count,
          eligibility_pts: rows.reduce((s, r) => s + (Number(r.eligibility_pts) || 0), 0) / count,
          count,
        });
      }

      const interGroups = new Map<string, typeof interviews>();
      for (const i of interviews ?? []) {
        if (!interGroups.has(i.applicant_id)) interGroups.set(i.applicant_id, []);
        interGroups.get(i.applicant_id)!.push(i);
      }
      const interAvg = new Map<string, {
        c1: number; c2: number; c3: number; c4: number; c5: number;
        c6: number; c7: number; c8: number; c9: number; c10: number;
        count: number;
      }>();
      for (const [appId, rows] of interGroups) {
        const count = rows.length;
        interAvg.set(appId, {
          c1:  rows.reduce((s, r) => s + (Number(r.c1)  || 0), 0) / count,
          c2:  rows.reduce((s, r) => s + (Number(r.c2)  || 0), 0) / count,
          c3:  rows.reduce((s, r) => s + (Number(r.c3)  || 0), 0) / count,
          c4:  rows.reduce((s, r) => s + (Number(r.c4)  || 0), 0) / count,
          c5:  rows.reduce((s, r) => s + (Number(r.c5)  || 0), 0) / count,
          c6:  rows.reduce((s, r) => s + (Number(r.c6)  || 0), 0) / count,
          c7:  rows.reduce((s, r) => s + (Number(r.c7)  || 0), 0) / count,
          c8:  rows.reduce((s, r) => s + (Number(r.c8)  || 0), 0) / count,
          c9:  rows.reduce((s, r) => s + (Number(r.c9)  || 0), 0) / count,
          c10: rows.reduce((s, r) => s + (Number(r.c10) || 0), 0) / count,
          count,
        });
      }

      const ranked: RankedApplicant[] = (applicants || []).map((app) => {
        const assess    = assessAvg.get(app.id);
        const inter     = interAvg.get(app.id);
        const hasAssess = !!assess;
        const hasInter  = !!inter;

        const edu = assess?.education_pts   ?? 0;
        const trn = assess?.training_pts    ?? 0;
        const exp = assess?.experience_pts  ?? 0;
        const elg = assess?.eligibility_pts ?? 0;
        const p1  = edu + trn + exp + elg;

        const c = [
          inter?.c1, inter?.c2, inter?.c3, inter?.c4, inter?.c5,
          inter?.c6, inter?.c7, inter?.c8, inter?.c9, inter?.c10,
        ].map((v) => v ?? 0);
        const p2 = c.reduce((s, v) => s + v, 0);

        const round = (n: number) => Math.round(n * 100) / 100;

        return {
          id:               app.id,
          name:             app.name,
          position_applied: app.position_applied ?? null,
          salary_grade:     app.salary_grade     ?? null,
          office:           app.office           ?? null,
          eligibility:      app.eligibility      ?? null,
          vacant_positions: app.vacant_positions ?? null,
          education_pts:    hasAssess ? round(edu) : null,
          training_pts:     hasAssess ? round(trn) : null,
          experience_pts:   hasAssess ? round(exp) : null,
          eligibility_pts:  hasAssess ? round(elg) : null,
          part1_total:      hasAssess ? round(p1)  : 0,
          c1:  hasInter ? round(c[0]) : null,
          c2:  hasInter ? round(c[1]) : null,
          c3:  hasInter ? round(c[2]) : null,
          c4:  hasInter ? round(c[3]) : null,
          c5:  hasInter ? round(c[4]) : null,
          c6:  hasInter ? round(c[5]) : null,
          c7:  hasInter ? round(c[6]) : null,
          c8:  hasInter ? round(c[7]) : null,
          c9:  hasInter ? round(c[8]) : null,
          c10: hasInter ? round(c[9]) : null,
          part2_total:      hasInter                ? round(p2)      : 0,
          grand_total:      round(p1 + p2),
          complete:         hasAssess && hasInter,
          rater_count_assess: assess?.count ?? 0,
          status: app.status ?? null,
          rater_count_inter:  inter?.count  ?? 0,
        };
      });

      ranked.sort((a, b) => {
        const aInactive = a.status === "dns" || a.status === "withdrawn";
        const bInactive = b.status === "dns" || b.status === "withdrawn";
        if (aInactive && !bInactive) return 1;
        if (!aInactive && bInactive) return -1;
        if (a.complete && !b.complete) return -1;
        if (!a.complete && b.complete) return 1;
        return (b.grand_total || 0) - (a.grand_total || 0);
      });

      return ranked;
    },
    enabled: !!officeId,
  });
}

/* ══════════════════════════════════════════════════════════════════
   SIGNATORIES — loaded from / saved to public.report_signatories
   ══════════════════════════════════════════════════════════════════ */

type SignatoryRow = {
  id: string;
  office_id: string;
  role: "prepared_by" | "hrmpsb_evaluator" | "approving_authority";
  name: string;
  title: string;
  sort_order: number;
};

function useSignatories() {
  const { officeId } = useAuth();
  return useQuery({
    queryKey: ["report_signatories", officeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_signatories")
        .select("id, office_id, role, name, title, sort_order")
        .eq("office_id", officeId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SignatoryRow[];
    },
    enabled: !!officeId,
  });
}

async function saveSignatory(
  officeId: string,
  role: SignatoryRow["role"],
  sortOrder: number,
  name: string,
  title: string
) {
  const { error } = await supabase
    .from("report_signatories")
    .upsert(
      { office_id: officeId, role, sort_order: sortOrder, name, title },
      { onConflict: "office_id,role,sort_order" }
    );
  if (error) throw error;
}

async function deleteSignatoriesFrom(
  officeId: string,
  role: SignatoryRow["role"],
  fromSortOrder: number
) {
  const { error } = await supabase
    .from("report_signatories")
    .delete()
    .eq("office_id", officeId)
    .eq("role", role)
    .gte("sort_order", fromSortOrder);
  if (error) throw error;
}

const COMPETENCY_LABELS = [
  { key: "c1",  label: "EXEMPLIFYING INTEGRITY" },
  { key: "c2",  label: "RESULTS ORIENTATION" },
  { key: "c3",  label: "QUALITY SERVICE ORIENTATION" },
  { key: "c4",  label: "TEAMWORK AND DEVELOPING PARTNERSHIP" },
  { key: "c5",  label: "PLANNING ORGANIZING AND DELIVERY" },
  { key: "c6",  label: "STRATEGIC AND CREATIVE THINKING" },
  { key: "c7",  label: "APPLICATION OF TECHNICAL KNOWLEDGE AND SKILLS" },
  { key: "c8",  label: "TRANSACTION PROCESSING" },
  { key: "c9",  label: "COMPUTER SKILLS" },
  { key: "c10", label: "DATA MANAGEMENT" },
];

const s = {
  th: {
    border: "1px solid #9ca3af",
    textAlign: "center" as const,
    verticalAlign: "middle" as const,
    background: "#f3f4f6",
    fontWeight: 600,
    fontSize: "8.5px",
    padding: "3px 4px",
    lineHeight: 1.3,
  },
  thBlue:   { border: "1px solid #9ca3af", textAlign: "center" as const, verticalAlign: "middle" as const, background: "#eff6ff", fontWeight: 600, fontSize: "8px", padding: "3px 4px", lineHeight: 1.3 },
  thBlue2:  { border: "1px solid #9ca3af", textAlign: "center" as const, verticalAlign: "middle" as const, background: "#dbeafe", fontWeight: 600, fontSize: "8px", padding: "3px 4px", lineHeight: 1.3 },
  thGreen:  { border: "1px solid #9ca3af", textAlign: "center" as const, verticalAlign: "middle" as const, background: "#f0fdf4", fontWeight: 600, fontSize: "8px", padding: "3px 4px", lineHeight: 1.3 },
  thGreen2: { border: "1px solid #9ca3af", textAlign: "center" as const, verticalAlign: "middle" as const, background: "#dcfce7", fontWeight: 600, fontSize: "8px", padding: "3px 4px", lineHeight: 1.3 },
  thYellow: { border: "1px solid #9ca3af", textAlign: "center" as const, verticalAlign: "middle" as const, background: "#fefce8", fontWeight: 600, fontSize: "8px", padding: "3px 4px", lineHeight: 1.3 },
  thOrange: { border: "1px solid #9ca3af", textAlign: "center" as const, verticalAlign: "middle" as const, background: "#fff7ed", fontWeight: 600, fontSize: "8px", padding: "3px 4px", lineHeight: 1.3 },
  td: {
    border: "1px solid #9ca3af",
    textAlign: "center" as const,
    verticalAlign: "middle" as const,
    fontSize: "10px",
    padding: "2px 4px",
  },
};

function LeafTh({ label, pct, style }: { label: string; pct: string; style: React.CSSProperties }) {
  return (
    <th style={{ ...style, minWidth: "68px", maxWidth: "90px", whiteSpace: "normal" }}>
      <div style={{ fontSize: "8px", fontWeight: 600, lineHeight: 1.25 }}>{label}</div>
      <div style={{ fontSize: "8px", color: "#555", marginTop: "3px" }}>{pct}</div>
    </th>
  );
}

function Num({ val }: { val: number | null }) {
  if (val !== null) return <span>{val}</span>;
  return <span style={{ color: "#9ca3af", fontSize: "8px" }}>—</span>;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "4px" }}>
        {label}
      </Label>
      <div
        style={{
          height: "32px",
          fontSize: "11px",
          padding: "0 10px",
          display: "flex",
          alignItems: "center",
          background: "#f3f4f6",
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          color: value ? "#111827" : "#9ca3af",
          userSelect: "none",
          cursor: "default",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function PrintField({
  value,
  label,
  flex = 1,
}: {
  value: string;
  label: string;
  flex?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex }}>
      <div
        style={{
          borderBottom: "1px solid #111",
          fontSize: "9px",
          fontWeight: 700,
          paddingBottom: "1px",
          textAlign: "center",
          letterSpacing: "0.03em",
          minHeight: "12px",
        }}
      >
        {value || "\u00a0"}
      </div>
      <div style={{ fontSize: "6.5px", color: "#444", textAlign: "center", marginTop: "1px" }}>
        {label}
      </div>
    </div>
  );
}

type Signatory = { name: string; title: string };

function SignatureBlock({
  value,
  onChange,
  onRemove,
  align = "center",
  editable = true,
}: {
  value: Signatory;
  onChange?: (next: Signatory) => void;
  onRemove?: () => void;
  align?: "left" | "center";
  editable?: boolean;
}) {
  return (
    <div
      className="sig-block"
      style={{
        width: "100%",
        minWidth: "120px",
        textAlign: align,
        position: "relative",
      }}
    >
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="no-print"
          title="Remove evaluator"
          style={{
            position: "absolute",
            top: "-6px",
            right: "-6px",
            width: "18px",
            height: "18px",
            borderRadius: "9999px",
            border: "1px solid #fca5a5",
            background: "#fef2f2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          <X style={{ width: "11px", height: "11px" }} />
        </button>
      )}

      <div className="sig-spacer" style={{ height: "34px" }} />
      <div style={{ width: "100%", borderBottom: "1px solid #111" }} />

      {/* ── Screen: editable inputs ── */}
      <input
        className="no-print sig-name-input"
        value={value.name}
        onChange={(e) => onChange?.({ ...value, name: e.target.value })}
        placeholder="Full name"
        readOnly={!editable}
        style={{
          textAlign: align,
          width: "100%",
          fontWeight: 700,
          fontSize: "10px",
          marginTop: "3px",
          border: "none",
          borderBottom: "1px dashed #cbd5e1",
          background: "transparent",
          outline: "none",
          padding: "2px 0",
          color: "#111827",
        }}
      />
      <input
        className="no-print sig-title-input"
        value={value.title}
        onChange={(e) => onChange?.({ ...value, title: e.target.value })}
        placeholder="Title / position"
        readOnly={!editable}
        style={{
          textAlign: align,
          width: "100%",
          color: "#4b5563",
          fontSize: "8.5px",
          border: "none",
          background: "transparent",
          outline: "none",
          padding: "1px 0",
        }}
      />

      {/* ── Print: plain formal text ── */}
      <div className="print-only sig-name" style={{ display: "none", textAlign: align, width: "100%", fontWeight: 700, fontSize: "10px", marginTop: "3px" }}>
        {value.name || "\u00a0"}
      </div>
      <div className="print-only sig-line" style={{ display: "none", textAlign: align, width: "100%", color: "#333", fontSize: "8.5px" }}>
        {value.title || "\u00a0"}
      </div>
    </div>
  );
}

const DEFAULT_PREPARED_BY: Signatory = {
  name: "Maria Guada F. Dosdos",
  title: "Administrative Assistant III",
};

const DEFAULT_HRMPSB_EVALUATORS: Signatory[] = [
  { name: "Maria Liza M. Bigornia", title: "Chairperson" },
  { name: "Jose B. Tuason Jr.", title: "Member" },
  { name: "Merlie T. Montera", title: "Member" },
];

const DEFAULT_APPROVING_AUTHORITY: Signatory = {
  name: "Janith C. Aves, CE, DM",
  title: "Regional Director",
};

const EMPTY_EVALUATOR: Signatory = { name: "", title: "Member" };
const MAX_EVALUATORS = 8;

export default function RankingsPage() {
  const { data: rankings, isLoading, error } = useRankings();
  const { officeId } = useAuth();
  const { data: savedSignatories } = useSignatories();
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [selectedOffice, setSelectedOffice] = useState<string>("");

  // Editable signatories
  const [preparedBy, setPreparedBy] = useState<Signatory>(DEFAULT_PREPARED_BY);
  const [hrmpsbEvaluators, setHrmpsbEvaluators] = useState<Signatory[]>(DEFAULT_HRMPSB_EVALUATORS);
  const [approvingAuthority, setApprovingAuthority] = useState<Signatory>(DEFAULT_APPROVING_AUTHORITY);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Interview date is now a plain editable field (ISO yyyy-mm-dd from <input type="date">).
  // It defaults to today on first load, but the user can change it to any date they like,
  // and printing no longer overwrites it.
  const [interviewDate, setInterviewDate] = useState<string>("");

  useEffect(() => {
    if (!interviewDate) {
      const today = new Date();
      const iso = today.toISOString().split("T")[0];
      setInterviewDate(iso);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatInterviewDate = (isoDate: string) => {
    if (!isoDate) return "";
    const d = new Date(isoDate + "T00:00:00");
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const handlePrint = () => {
    window.print();
  };

  // Only apply DB values once, so we don't stomp on the user's typing whenever
  // the query refetches in the background.
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current || !savedSignatories) return;
    if (savedSignatories.length === 0) {
      hydratedRef.current = true;
      return;
    }
    const prepared = savedSignatories.find((r) => r.role === "prepared_by");
    const approving = savedSignatories.find((r) => r.role === "approving_authority");
    const evaluators = savedSignatories
      .filter((r) => r.role === "hrmpsb_evaluator")
      .sort((a, b) => a.sort_order - b.sort_order);

    if (prepared) setPreparedBy({ name: prepared.name, title: prepared.title });
    if (approving) setApprovingAuthority({ name: approving.name, title: approving.title });
    if (evaluators.length > 0) {
      setHrmpsbEvaluators(evaluators.map((e) => ({ name: e.name, title: e.title })));
    }
    hydratedRef.current = true;
  }, [savedSignatories]);

  const updateEvaluator = (idx: number, next: Signatory) => {
    setHrmpsbEvaluators((prev) => prev.map((p, i) => (i === idx ? next : p)));
  };

  const addEvaluator = () => {
    setHrmpsbEvaluators((prev) => {
      if (prev.length >= MAX_EVALUATORS) return prev;
      return [...prev, { ...EMPTY_EVALUATOR }];
    });
  };

  const removeEvaluator = (idx: number) => {
    setHrmpsbEvaluators((prev) => {
      if (prev.length <= 1) return prev; // keep at least one row
      const next = prev.filter((_, i) => i !== idx);
      // Clean up the now-orphaned trailing DB row for the removed slot count.
      if (officeId) {
        deleteSignatoriesFrom(officeId, "hrmpsb_evaluator", next.length).catch((err) =>
          console.error("Failed to clean up removed evaluator row:", err)
        );
      }
      return next;
    });
  };

  // Debounced autosave — fires ~800ms after the last edit to any signatory field.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydratedRef.current || !officeId) return;
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await Promise.all([
          saveSignatory(officeId, "prepared_by", 0, preparedBy.name, preparedBy.title),
          saveSignatory(officeId, "approving_authority", 0, approvingAuthority.name, approvingAuthority.title),
          ...hrmpsbEvaluators.map((e, i) => saveSignatory(officeId, "hrmpsb_evaluator", i, e.name, e.title)),
        ]);
        setSaveStatus("saved");
      } catch (err) {
        console.error("Failed to save signatories:", err);
        setSaveStatus("error");
      }
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preparedBy, hrmpsbEvaluators, approvingAuthority, officeId]);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "rankings-print-style";
    style.innerHTML = `
      @media print {
        @page { size: legal landscape; margin: 3mm; }

        /* ── Bulletproof print isolation ──
           Hide everything, then reveal + absolutely position only the
           print area. This makes AppLayout's own height/flex/scroll
           wrappers irrelevant — the #1 cause of blank/extra pages. */
        body * {
          visibility: hidden !important;
        }
        .print-area, .print-area * {
          visibility: visible !important;
        }
        .print-area {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        html, body {
          height: auto !important;
          width: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        .no-print { display: none !important; }
        .print-only { display: flex !important; }
        .print-only[style*="flex-direction: column"] { flex-direction: column !important; }
        *, *::before, *::after {
          overflow: visible !important;
          max-width: none !important;
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        .table-scroll-wrapper {
          overflow: visible !important;
        }
        table {
          min-width: unset !important;
          width: 100% !important;
          table-layout: fixed !important;
          font-size: 5px !important;
          border-collapse: collapse !important;
        }
        th, td {
          padding: 0px 2px !important;
          font-size: 5px !important;
          word-break: break-word !important;
          line-height: 1.15 !important;
        }
        th div, td div, td span {
          font-size: 5px !important;
        }
        /* Empty filler rows and data rows: keep them short on print */
        table tbody tr td {
          height: 10px !important;
        }
        .sig-block {
          max-width: 200px !important;
        }
        .sig-block > div[style*="borderBottom"] {
          max-width: 180px !important;
        }
        .sig-name {
          font-size: 9px !important;
          font-family: "Times New Roman", Times, serif !important;
          letter-spacing: 0.02em !important;
        }
        .sig-line {
          font-size: 8px !important;
          font-family: "Times New Roman", Times, serif !important;
          font-style: italic !important;
        }
        .sig-title {
          font-size: 8px !important;
        }
        .action-lines {
          font-size: 8px !important;
        }
        .footnote {
          font-size: 7px !important;
        }
        .sig-block > div {
          font-size: 8px !important;
        }
        .form-label {
          display: none !important;
        }
        header, nav, aside, footer {
          display: none !important;
        }
        main, [data-main], .main-content {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
        }

        .page-wrap {
          padding: 0 !important;
          gap: 1px !important;
          transform: scale(1);
          transform-origin: top left;
          page-break-inside: avoid !important;
        }
        h1.no-print { display: none !important; }
        .sig-area {
          margin-top: 2px !important;
          font-size: 6px !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .sig-section {
          margin-bottom: 1px !important;
        }
        .sig-title {
          font-size: 5.5px !important;
          margin-bottom: 1px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.03em !important;
        }
        .sig-row {
          display: grid !important;
          gap: 10px !important;
        }
        .sig-block {
          min-width: 60px !important;
          max-width: 130px !important;
          text-align: center !important;
        }
        .sig-spacer {
          height: 6px !important;
        }
        .sig-name {
          font-size: 5.5px !important;
          margin-top: 1px !important;
          text-align: center !important;
          width: 100% !important;
        }
        .sig-line {
          font-size: 4.8px !important;
          text-align: center !important;
          width: 100% !important;
        }
        .action-block {
          padding-top: 1px !important;
          margin-top: 1px !important;
        }
        .action-lines {
          gap: 0px !important;
          font-size: 5px !important;
        }
        .final-sig {
          margin-top: 1px !important;
        }
        .footnote {
          font-size: 4.5px !important;
          margin-top: 1px !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById("rankings-print-style");
      if (el) document.head.removeChild(el);
    };
  }, []);

  const positionOptions = Array.from(
    new Map(
      (rankings ?? [])
        .filter((r) => r.position_applied)
        .map((r) => [
          `${r.position_applied}||${r.office}`,
          { position: r.position_applied!, office: r.office ?? "" },
        ])
    ).values()
  );

  useEffect(() => {
    if (positionOptions.length > 0 && !selectedPosition) {
      setSelectedPosition(positionOptions[0].position);
      setSelectedOffice(positionOptions[0].office);
    }
  }, [rankings]);

  const filteredRows = (rankings ?? []).filter(
    (r) => r.position_applied === selectedPosition && r.office === selectedOffice
  );

  const selectedInfo = filteredRows[0];
  const positionInfo = {
    position:        selectedInfo?.position_applied ?? "",
    office:          selectedInfo?.office           ?? "",
    salaryGrade:     selectedInfo?.salary_grade     ?? "",
    vacantPositions: selectedInfo?.vacant_positions ?? "",
  };

  const emptyCount = Math.max(0, 11 - filteredRows.length);

  const rowBg = (idx: number, r: RankedApplicant): string => {
    if (r.status === "dns")       return "#fef2f2";
    if (r.status === "withdrawn") return "#faf5ff";
    if (!r.complete) return "transparent";
    if (idx === 0) return "#fff9c4";
    if (idx === 1) return "#f3f4f6";
    if (idx === 2) return "#f9fafb";
    return "transparent";
  };

  return (
    <AppLayout>
      <div className="print-area">
      {/* ── PRINT-ONLY HEADER ── */}
      <div
        className="print-only"
        style={{
          display: "none",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "6px 10px 8px",
          marginBottom: "8px",
          width: "100%",
          position: "relative",
        }}
      >
        <div className="form-label" style={{ position: "absolute", top: 0, right: 0, textAlign: "right", fontSize: "6.5px", lineHeight: 1.3, color: "#333" }}>
          <div>PSA-RO-HRMPSB Form 6</div>
          <div style={{ fontStyle: "italic" }}>(Evaluation Summary Form)</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src="/assets/psa-seal.png"
            alt="PSA Logo"
            style={{ height: "60px", width: "auto", objectFit: "contain" }}
          />
          <div style={{ lineHeight: 1.35 }}>
            <div style={{ fontSize: "8px", color: "#555", fontStyle: "italic" }}>
              Republic of the Philippines
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e3a5f", letterSpacing: "0.03em", borderBottom: "1px solid #1e3a5f", paddingBottom: "2px" }}>
              PHILIPPINE STATISTICS AUTHORITY
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#111" }}>
            Evaluation Summary
          </div>
        </div>

        <img
          src="/assets/Bagong_Pilipinas_Logo.svg.webp"
          alt="Bagong Pilipinas"
          style={{ height: "60px", width: "60px", objectFit: "contain", marginTop: "10px" }}
        />
      </div>
      {/* ── END PRINT-ONLY HEADER ── */}

      <div className="mb-4 flex items-center gap-4 no-print">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/applicants"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <div className="flex-1" />
        <span style={{ fontSize: "11px", color: saveStatus === "error" ? "#dc2626" : "#6b7280" }}>
          {saveStatus === "saving" && "Saving…"}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "error" && "Failed to save"}
        </span>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
      </div>

      <div className="page-wrap" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        <h1 className="no-print" style={{ textAlign: "center", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
          Selection Criteria Rankings
        </h1>

        {!isLoading && positionOptions.length > 0 && (
          <div className="no-print" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px" }}>
            <Label style={{ fontSize: "12px", fontWeight: 600, color: "#1d4ed8", whiteSpace: "nowrap" }}>
              Filter by Position &amp; Office:
            </Label>
            <select
              value={`${selectedPosition}||${selectedOffice}`}
              onChange={(e) => {
                const [pos, off] = e.target.value.split("||");
                setSelectedPosition(pos);
                setSelectedOffice(off);
              }}
              style={{
                flex: 1,
                height: "34px",
                fontSize: "12px",
                padding: "0 10px",
                border: "1px solid #93c5fd",
                borderRadius: "6px",
                background: "#fff",
                color: "#111827",
                cursor: "pointer",
              }}
            >
              {positionOptions.map((opt) => (
                <option key={`${opt.position}||${opt.office}`} value={`${opt.position}||${opt.office}`}>
                  {opt.position} — {opt.office || "No Office"}
                </option>
              ))}
            </select>
            <span style={{ fontSize: "11px", color: "#6b7280", whiteSpace: "nowrap" }}>
              {filteredRows.length} applicant{filteredRows.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        <div className="no-print" style={{ padding: "12px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1.2fr", gap: "12px" }}>
            <ReadOnlyField label="Office/Service/Division/Unit" value={positionInfo.office} />
            <ReadOnlyField label="Position" value={positionInfo.position} />
            <ReadOnlyField label="Salary Grade" value={positionInfo.salaryGrade} />
            <ReadOnlyField label="No. of Vacant Positions" value={positionInfo.vacantPositions} />
            <div>
              <Label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "4px" }}>
                Interview Date
              </Label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                style={{
                  height: "32px",
                  fontSize: "11px",
                  padding: "0 10px",
                  width: "100%",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  background: "#fff",
                  color: "#111827",
                }}
              />
            </div>
          </div>
        </div>

        <div
          className="print-only"
          style={{
            display: "none",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "4px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", flex: "0 0 auto", minWidth: "180px", alignItems: "flex-start" }}>
              <div style={{ width: "100%" }}>
                <PrintField value={positionInfo.office} label="Office/Service/Division/Unit" />
              </div>
              <div style={{ width: "100%" }}>
                <div
                  style={{
                    borderBottom: "1px solid #111",
                    fontSize: "9px",
                    fontWeight: 700,
                    paddingBottom: "1px",
                    textAlign: "center",
                    letterSpacing: "0.03em",
                    minHeight: "12px",
                  }}
                >
                  {positionInfo.position || "\u00a0"}
                </div>
                <div style={{ fontSize: "6.5px", color: "#444", textAlign: "center", marginTop: "1px" }}>
                  Position
                </div>
              </div>
            </div>
            <PrintField value={positionInfo.salaryGrade} label="Salary Grade" flex={1} />
            <PrintField value={positionInfo.vacantPositions} label="No. of Vacant Positions" flex={1} />
            <PrintField value={formatInterviewDate(interviewDate)} label="Interview Date" flex={1.5} />
            <PrintField value="" label="Item No." flex={1.5} />
          </div>
        </div>

        {error && (
          <div style={{ padding: "10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "12px", color: "#dc2626" }}>
            Error loading data: {String(error)}
          </div>
        )}

        {isLoading && (
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: "13px" }}>Loading rankings...</p>
        )}

        {!isLoading && positionOptions.length === 0 && (
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: "13px" }}>No applicants found.</p>
        )}

        {!isLoading && positionOptions.length > 0 && (
          <div className="table-scroll-wrapper" style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: "10px", minWidth: "1500px" }}>
              <thead>
                <tr>
                  <th rowSpan={4} style={{ ...s.th, width: "36px" }}>RANK<br />NO.</th>
                  <th rowSpan={4} style={{ ...s.th, minWidth: "120px" }}>NAME OF<br />CANDIDATE</th>
                  <th rowSpan={4} style={{ ...s.th, minWidth: "100px" }}>POSITION<br />APPLIED</th>
                  <th rowSpan={4} style={{ ...s.th, width: "30px" }}>SG</th>
                  <th rowSpan={4} style={{ ...s.th, minWidth: "100px" }}>OFFICE</th>
                  <th rowSpan={4} style={{ ...s.th, minWidth: "90px" }}>ELIGIBILITY</th>
                  <th colSpan={16} style={{ border: "1px solid #9ca3af", textAlign: "center", background: "#e5e7eb", fontWeight: 700, fontSize: "11px", letterSpacing: "0.1em", padding: "5px 4px" }}>
                    SELECTION CRITERIA
                  </th>
                  <th rowSpan={4} style={{ ...s.th, width: "52px" }}>TOTAL<br />SCORE</th>
                  <th rowSpan={4} style={{ ...s.th, minWidth: "72px" }}>REMARKS</th>
                </tr>
                <tr>
                  <th colSpan={5} style={s.thBlue}>I. DOCUMENTARY REQUIREMENTS (Qualification Standards)</th>
                  <th colSpan={11} style={s.thGreen}>II. COMPETENCY BASED INTERVIEW</th>
                </tr>
                <tr>
                  <th colSpan={4} style={s.thBlue}>Qualification Standards (60%)</th>
                  <th rowSpan={2} style={{ ...s.thBlue2, width: "48px" }}>TOTAL<br />(Part I)<br />60%</th>
                  <th colSpan={4} style={s.thGreen}>A. Core Competencies</th>
                  <th colSpan={3} style={s.thYellow}>B. Leadership Competencies</th>
                  <th colSpan={3} style={s.thOrange}>C. Technical Competencies</th>
                  <th rowSpan={2} style={{ ...s.thGreen2, width: "48px" }}>TOTAL<br />(Part II)<br />40%</th>
                </tr>
                <tr>
                  <LeafTh label="EDUCATION" pct="20%" style={s.thBlue} />
                  <LeafTh label="RELEVANT TRAINING" pct="15%" style={s.thBlue} />
                  <LeafTh label="RELEVANT WORK EXPERIENCE" pct="15%" style={s.thBlue} />
                  <LeafTh label="ELIGIBILITY" pct="10%" style={s.thBlue} />
                  {COMPETENCY_LABELS.slice(0, 4).map(({ key, label }) => (
                    <LeafTh key={key} label={label} pct="4%" style={s.thGreen} />
                  ))}
                  {COMPETENCY_LABELS.slice(4, 7).map(({ key, label }) => (
                    <LeafTh key={key} label={label} pct="4%" style={s.thYellow} />
                  ))}
                  {COMPETENCY_LABELS.slice(7, 10).map(({ key, label }) => (
                    <LeafTh key={key} label={label} pct="4%" style={s.thOrange} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, idx) => {
                  const isDns       = r.status === "dns";
                  const isWithdrawn = r.status === "withdrawn";
                  const isInactive  = isDns || isWithdrawn;
                  const strikeColor = isDns ? "#dc2626" : isWithdrawn ? "#7c3aed" : undefined;
                  const dnsStyle    = isInactive ? { textDecoration: "line-through" as const, color: strikeColor } : {};

                  return (
                    <tr key={r.id} style={{ backgroundColor: rowBg(idx, r), opacity: isInactive ? 0.8 : 1 }}>
                      <td style={{ ...s.td, fontWeight: 700, ...dnsStyle }}>
                        {isInactive ? "—" : r.complete ? idx + 1 : "—"}
                      </td>
                      <td style={{ ...s.td, textAlign: "left", fontWeight: 500, ...dnsStyle }}>
                        {r.name}
                        {isInactive && (
                          <span style={{
                            marginLeft: 4, fontSize: "8px", fontWeight: 700,
                            color: strikeColor, textDecoration: "none",
                          }}>
                            {isDns ? "(DNS)" : "(WD)"}
                          </span>
                        )}
                      </td>
                      <td style={{ ...s.td, textAlign: "left", fontSize: "9px", ...dnsStyle }}>{r.position_applied || "—"}</td>
                      <td style={{ ...s.td, ...dnsStyle }}>{r.salary_grade || "—"}</td>
                      <td style={{ ...s.td, textAlign: "left", fontSize: "9px", ...dnsStyle }}>{r.office || "—"}</td>
                      <td style={{ ...s.td, textAlign: "left", fontSize: "9px", ...dnsStyle }}>{r.eligibility || "—"}</td>
                      <td style={s.td}><Num val={r.education_pts} /></td>
                      <td style={s.td}><Num val={r.training_pts} /></td>
                      <td style={s.td}><Num val={r.experience_pts} /></td>
                      <td style={s.td}><Num val={r.eligibility_pts} /></td>
                      <td style={{ ...s.td, fontWeight: 700, background: "#dbeafe" }}><Num val={r.part1_total} /></td>
                      {(["c1","c2","c3","c4","c5","c6","c7","c8","c9","c10"] as const).map((k) => (
                        <td key={k} style={s.td}><Num val={r[k]} /></td>
                      ))}
                      <td style={{ ...s.td, fontWeight: 700, background: "#dcfce7" }}><Num val={r.part2_total} /></td>
                      <td style={{ ...s.td, fontWeight: 700, fontSize: "11px", color: "#1d4ed8" }}>
                        {r.grand_total !== null
                          ? r.grand_total
                          : <Badge variant="secondary" style={{ fontSize: "8px", padding: "0 4px" }}>pending</Badge>}
                      </td>
                      <td style={s.td}>
                        {isDns ? (
                          <Badge variant="destructive" style={{ fontSize: "8px", background: "#dc2626" }}>
                            Did Not Show Up
                          </Badge>
                        ) : isWithdrawn ? (
                          <Badge style={{ fontSize: "8px", background: "#7c3aed", color: "#fff", border: "none" }}>
                            Withdrawn
                          </Badge>
                        ) : r.complete ? (
                          idx === 0
                            ? <span style={{ fontWeight: 700, color: "#1d4ed8" }}>Rank 1</span>
                            : <Badge variant="outline" style={{ fontSize: "8px" }}>Qualified</Badge>
                        ) : (
                          <Badge variant="secondary" style={{ fontSize: "8px" }}>Incomplete</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {Array.from({ length: emptyCount }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td style={{ ...s.td, color: "#d1d5db", height: "28px" }}>{filteredRows.length + i + 1}</td>
                    {Array.from({ length: 19 }).map((__, j) => (
                      <td key={j} style={{ ...s.td, height: "28px" }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && positionOptions.length > 0 && (
          <div className="sig-area" style={{ marginTop: "20px", fontSize: "11px" }}>

            <div className="sig-section" style={{ marginBottom: "18px" }}>
              <div className="sig-title" style={{ fontWeight: 600, marginBottom: "4px" }}>Prepared by:</div>
              <div style={{ maxWidth: "260px" }}>
                <SignatureBlock value={preparedBy} onChange={setPreparedBy} align="center" />
              </div>
            </div>

            <div className="sig-section" style={{ marginBottom: "18px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <div className="sig-title" style={{ fontWeight: 600 }}>Evaluated/Deliberated by the HRMPSB:</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="no-print"
                  onClick={addEvaluator}
                  disabled={hrmpsbEvaluators.length >= MAX_EVALUATORS}
                  style={{ height: "26px", fontSize: "11px", padding: "0 8px" }}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Evaluator
                </Button>
              </div>
              <div
                className="sig-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${hrmpsbEvaluators.length}, 1fr)`,
                  gap: "32px",
                }}
              >
                {hrmpsbEvaluators.map((p, i) => (
                  <SignatureBlock
                    key={i}
                    value={p}
                    onChange={(next) => updateEvaluator(i, next)}
                    onRemove={hrmpsbEvaluators.length > 1 ? () => removeEvaluator(i) : undefined}
                  />
                ))}
              </div>
            </div>

            <div className="sig-section action-block" style={{ borderTop: "1px solid #9ca3af", paddingTop: "12px", marginTop: "8px" }}>
              <div className="sig-title" style={{ fontWeight: 700, marginBottom: "8px" }}>ACTION TAKEN BY THE APPOINTING AUTHORITY:</div>
              <div className="action-lines" style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "10px" }}>
                <div>{"( )"} I hereby order the selection of applicant rank no/s. _______ and corresponding appointment be issued in accordance w/ CSC laws, rules and regulation:</div>
                <div>{"( )"} I choose to select only _______ applicant/s out of _______ vacancies and hereby order the reposting of the remaining vacant position/s.</div>
                <div>{"( )"} I choose not to select any/all applicant/s and hereby order the declaration of failure of selection and henceforth reposting of the vacant position/s.</div>
              </div>

              <div className="final-sig" style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                <div style={{ maxWidth: "260px" }}>
                  <SignatureBlock value={approvingAuthority} onChange={setApprovingAuthority} />
                </div>
              </div>
            </div>

            <p className="footnote" style={{ textAlign: "center", fontSize: "10px", fontStyle: "italic", color: "#6b7280", marginTop: "16px" }}>
              The selection of the candidate recommended for appointment is based on the order of ranking as shown above.
            </p>
          </div>
        )}
      </div>
      </div>
    </AppLayout>
  );
}