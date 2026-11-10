import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import {
  useApplicants, useCreateApplicant, useUpdateApplicant, useDeleteApplicant,
  useUpdateApplicantStatus, uploadApplicantDoc, TOTAL_INTERVIEW_ACCOUNTS, type Applicant
} from "@/hooks/useApplicants";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, FileText, ClipboardList, Users, CheckCircle, Clock, Upload, FolderOpen, ExternalLink, Loader2, ChevronLeft } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocFiles = {
  application_letter: File | null;
  pds: File | null;
  wes: File | null;
  diploma: File | null;
  tor: File | null;
  ipcr: File | null;
};

type FormData = Omit<Applicant, "id" | "created_at" | "has_assessment" | "has_interview" | "interview_count" | "doc_application_letter" | "doc_pds" | "doc_wes" | "doc_diploma" | "doc_tor" | "doc_ipcr">;

const emptyForm: FormData = {
  name: "", previous_position: "", position_applied: "", salary_grade: "",
  eligibility: "", office: "", contact: "", email: "", vacant_positions: "",
};

const emptyDocs: DocFiles = {
  application_letter: null, pds: null, wes: null,
  diploma: null, tor: null, ipcr: null,
};

const DOC_LABELS: { key: keyof DocFiles; label: string; required: boolean }[] = [
  { key: "application_letter", label: "Application Letter",             required: true },
  { key: "pds",                label: "Personal Data Sheet (PDS)",      required: true },
  { key: "wes",                label: "Work Experience Sheet (WES)",    required: true },
  { key: "diploma",            label: "Diploma",                        required: true },
  { key: "tor",                label: "Transcript of Records (TOR)",    required: true },
  { key: "ipcr",               label: "IPCR / Performance Rating",      required: false },
];

// ─── File Upload Field ────────────────────────────────────────────────────────

function FileUploadField({
  label, file, existingUrl, onChange, required,
}: {
  label: string; file: File | null; existingUrl?: string | null;
  onChange: (f: File | null) => void; required?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="grid gap-1">
      <Label className="text-xs">
        {label}{" "}
        {required
          ? <span className="text-red-500">*</span>
          : <span className="text-muted-foreground font-normal">(optional)</span>}
      </Label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-left transition-colors
            ${file ? "border-green-500 bg-green-50 text-green-700"
              : existingUrl ? "border-blue-400 bg-blue-50 text-blue-700"
              : "border-dashed border-gray-300 text-muted-foreground hover:border-gray-400 hover:bg-gray-50"}`}
        >
          <Upload className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {file ? file.name : existingUrl ? "Replace file" : "Click to upload"}
          </span>
        </button>
        {existingUrl && !file && (
          <a href={existingUrl} target="_blank" rel="noopener noreferrer" title="View existing file">
            <Button variant="ghost" size="sm" type="button" className="px-2">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        )}
      </div>
      <input ref={ref} type="file" className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={(e) => onChange(e.target.files?.[0] || null)} />
    </div>
  );
}

// ─── Applicant Form ───────────────────────────────────────────────────────────

function ApplicantForm({
  initial, onSubmit, onClose, existingApplicants, isEditing, existingDocs,
}: {
  initial: FormData; onSubmit: (d: FormData, docs: DocFiles) => void;
  onClose: () => void; existingApplicants: Applicant[];
  isEditing: boolean; existingDocs?: { [k: string]: string | null | undefined };
}) {
  const [form, setForm] = useState<FormData>(initial);
  const [docs, setDocs] = useState<DocFiles>(emptyDocs);
  const set = (k: keyof FormData, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const setDoc = (k: keyof DocFiles, f: File | null) => setDocs((p) => ({ ...p, [k]: f }));

  const existingPositions = Array.from(
    new Set(existingApplicants.map((a) => a.position_applied).filter(Boolean))
  );

  const handlePositionChange = (value: string) => {
    set("position_applied", value);
    const match = existingApplicants.find(
      (a) => a.position_applied?.toLowerCase() === value.toLowerCase()
    );
    if (match) {
      setForm((prev) => ({
        ...prev, position_applied: value,
        salary_grade: match.salary_grade || prev.salary_grade,
        office: match.office || prev.office,
        vacant_positions: match.vacant_positions || prev.vacant_positions,
      }));
    }
  };

  const allDocsProvided = isEditing || DOC_LABELS
    .filter((d) => d.required)
    .every(({ key }) => docs[key] !== null);

  return (
    <div className="grid gap-4 max-h-[75vh] overflow-y-auto pr-1">
      <div className="grid gap-2">
        <Label>Full Name (Last, First Middle) *</Label>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Dela Cruz, Juan Santos" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Position Applied For *</Label>
          <Input list="position-suggestions" value={form.position_applied}
            onChange={(e) => handlePositionChange(e.target.value)} placeholder="Type or select a position" />
          <datalist id="position-suggestions">
            {existingPositions.map((pos) => <option key={pos} value={pos!} />)}
          </datalist>
          {!isEditing && form.position_applied &&
            existingApplicants.some(
              (a) => a.position_applied?.toLowerCase() === form.position_applied.toLowerCase()
            ) && (
              <p className="text-xs text-blue-600 flex items-center gap-1">✓ Auto-filled from existing position data</p>
            )}
        </div>
        <div className="grid gap-2">
          <Label>Position</Label>
          <Input value={form.previous_position || ""} onChange={(e) => set("previous_position", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Salary Grade</Label>
          <Input value={form.salary_grade || ""} onChange={(e) => set("salary_grade", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Eligibility</Label>
          <Input value={form.eligibility || ""} onChange={(e) => set("eligibility", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>No. of Vacant Positions</Label>
        <Input type="number" min={0} value={form.vacant_positions || ""}
          onChange={(e) => set("vacant_positions", e.target.value)} placeholder="e.g. 3" />
      </div>
      <div className="grid gap-2">
        <Label>Office / Current Station</Label>
        <Input value={form.office || ""} onChange={(e) => set("office", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Contact Number</Label>
          <Input value={form.contact || ""} onChange={(e) => set("contact", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Email Address</Label>
          <Input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>
      <div className="border-t pt-3">
        <p className="text-sm font-medium mb-3 flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Documents
          {!isEditing && <span className="text-red-500 text-xs font-normal">(required fields marked *)</span>}
          {isEditing && <span className="text-muted-foreground text-xs font-normal">(upload to replace)</span>}
        </p>
        <div className="grid gap-2">
          {DOC_LABELS.map(({ key, label, required }) => (
            <FileUploadField key={key} label={label} file={docs[key]}
              existingUrl={existingDocs?.[`doc_${key}`]}
              onChange={(f) => setDoc(key, f)} required={!isEditing && required} />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSubmit(form, docs)}
          disabled={!form.name || !form.position_applied || !allDocsProvided}>
          Save
        </Button>
      </div>
    </div>
  );
}

// ─── Documents Viewer Dialog ──────────────────────────────────────────────────

function DocumentsDialog({ applicant }: { applicant: Applicant }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{ label: string; url: string } | null>(null);

  const docs = [
    { label: "Application Letter",           url: applicant.doc_application_letter },
    { label: "Personal Data Sheet (PDS)",    url: applicant.doc_pds },
    { label: "Work Experience Sheet (WES)",  url: applicant.doc_wes },
    { label: "Diploma",                      url: applicant.doc_diploma },
    { label: "Transcript of Records (TOR)",  url: applicant.doc_tor },
    { label: "IPCR / Performance Rating",    url: applicant.doc_ipcr },
  ];

  const hasAny = docs.some((d) => d.url);
  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url.split("?")[0]);
  const isPhone = /iPhone|Android.*Mobile|Opera Mini|IEMobile/i.test(navigator.userAgent);
  const getViewerUrl = (url: string) =>
    isImage(url) ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPreview(null); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="View Documents"><FolderOpen className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {preview ? (
              <>
                <button onClick={() => setPreview(null)}
                  className="flex items-center gap-1 text-sm font-normal text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <span className="text-base font-semibold">{preview.label}</span>
              </>
            ) : <>Documents — {applicant.name}</>}
          </DialogTitle>
        </DialogHeader>
        {!preview && (
          !hasAny ? (
            <p className="text-sm text-muted-foreground text-center py-6">No documents uploaded yet.</p>
          ) : (
            <div className="grid gap-2 py-2">
              {docs.map(({ label, url }) => (
                <div key={label} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{label}</span>
                  </div>
                  {url ? (
                    <div className="flex items-center gap-1 shrink-0">
                      {isPhone ? (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="text-xs gap-1">
                            <ExternalLink className="h-3 w-3" /> Open
                          </Button>
                        </a>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" className="text-xs gap-1"
                            onClick={() => setPreview({ label, url })}>
                            <FileText className="h-3 w-3" /> Preview
                          </Button>
                          <a href={url} target="_blank" rel="noopener noreferrer" title="Open in new tab">
                            <Button variant="ghost" size="sm" className="px-2">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not uploaded</span>
                  )}
                </div>
              ))}
            </div>
          )
        )}
        {preview && (
          <div className="mt-2 rounded-md border overflow-hidden bg-muted" style={{ height: "70vh" }}>
            {isImage(preview.url) ? (
              <img src={preview.url} alt={preview.label} className="w-full h-full object-contain" />
            ) : (
              <iframe src={getViewerUrl(preview.url)} title={preview.label} className="w-full h-full border-0" />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Interview Progress (who has / hasn't scored) ─────────────────────────────

function InterviewProgress({ applicant }: { applicant: Applicant }) {
  const { officeId } = useAuth();
  const [open, setOpen] = useState(false);
  const count = applicant.interview_count || 0;
  const done = count === TOTAL_INTERVIEW_ACCOUNTS;
  const doneIds = new Set(applicant.interviewer_ids || []);

  const { data: members } = useQuery({
    queryKey: ["interviewers", officeId],
    enabled: open && !!officeId,
    queryFn: async () => {
      const { data: rpc, error } = await (supabase as any).rpc("get_office_interviewers");
      if (!error && rpc) return rpc as any[];
      const { data } = await (supabase as any).from("profiles").select("*").eq("office_id", officeId!);
      return ((data || []) as any[]).filter((p) => p.role !== "superadmin");
    },
  });

  const label = (p: any) => p.email || p.full_name || p.name || p.display_name || p.id.slice(0, 8);
  const rows = (members || []).map((p) => ({ key: p.id, name: label(p), scored: doneIds.has(p.id) }));
  const known = new Set(rows.map((r) => r.key));
  const unknownDone = [...doneIds].filter((i) => !known.has(i));
  unknownDone.forEach((i, n) => rows.push({ key: i, name: `Interviewer (${i.slice(0, 8)})`, scored: true }));
  rows.sort((a, b) => Number(a.scored) - Number(b.scored) || a.name.localeCompare(b.name));
  const pending = rows.filter((r) => !r.scored).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" title="See who has scored">
          <Badge variant={done ? "default" : "secondary"} className="text-xs cursor-pointer hover:opacity-80">
            {done ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
            Form 4 {count}/{TOTAL_INTERVIEW_ACCOUNTS}
          </Badge>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Form 4 — {applicant.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {count} of {TOTAL_INTERVIEW_ACCOUNTS} scored{members && ` · ${pending} pending`}
        </p>
        <div className="grid gap-2">
          {!members ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : !rows.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No interviewers found.</p>
          ) : rows.map((r) => (
            <div key={r.key} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm truncate">{r.name}</span>
              {r.scored ? (
                <Badge className="text-xs"><CheckCircle className="h-3 w-3 mr-1" />Scored</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />Not yet</Badge>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Status Dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({ applicant }: { applicant: Applicant }) {
  const updateStatus = useUpdateApplicantStatus();
  const isDns = applicant.status === "dns";
  const isWithdrawn = applicant.status === "withdrawn";

  const borderColor = isDns ? "#fca5a5" : isWithdrawn ? "#d8b4fe" : "#d1d5db";
  const bgColor     = isDns ? "#fef2f2" : isWithdrawn ? "#faf5ff" : "#f9fafb";
  const textColor   = isDns ? "#dc2626" : isWithdrawn ? "#7c3aed" : "#374151";

  return (
    <select
      value={applicant.status ?? "active"}
      onChange={(e) =>
        updateStatus.mutate({
          id: applicant.id,
          status: e.target.value as "active" | "dns" | "withdrawn",
        })
      }
      disabled={updateStatus.isPending}
      style={{
        fontSize: "11px",
        padding: "3px 6px",
        borderRadius: "6px",
        border: `1px solid ${borderColor}`,
        background: bgColor,
        color: textColor,
        fontWeight: isDns || isWithdrawn ? 600 : 400,
        cursor: "pointer",
        outline: "none",
      }}
    >
      <option value="active">✅ Active</option>
      <option value="dns">🚫 Did Not Show Up</option>
      <option value="withdrawn">↩️ Withdrawn</option>
    </select>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApplicantsPage() {
  const { data: applicants, isLoading } = useApplicants();
  const { isSuperAdmin } = useAuth();
  const createMut = useCreateApplicant();
  const updateMut = useUpdateApplicant();
  const deleteMut = useDeleteApplicant();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Applicant | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const activeApplicants = applicants?.filter((a) => a.status !== "dns" && a.status !== "withdrawn") || [];
  const totalApplicants = applicants?.length || 0;
  const totalAssessed = activeApplicants.filter((a) => a.has_assessment).length;
  const totalInterviewed = activeApplicants.filter((a) => (a.interview_count || 0) >= TOTAL_INTERVIEW_ACCOUNTS).length;

  const handleCreate = async (data: FormData, docs: DocFiles) => {
    setUploading(true);
    try {
      const [doc_application_letter, doc_pds, doc_wes, doc_diploma, doc_tor] = await Promise.all([
        uploadApplicantDoc(data.name, "application_letter", docs.application_letter!),
        uploadApplicantDoc(data.name, "pds",                docs.pds!),
        uploadApplicantDoc(data.name, "wes",                docs.wes!),
        uploadApplicantDoc(data.name, "diploma",            docs.diploma!),
        uploadApplicantDoc(data.name, "tor",                docs.tor!),
      ]);
      const doc_ipcr = docs.ipcr ? await uploadApplicantDoc(data.name, "ipcr", docs.ipcr) : null;
      createMut.mutate(
        { ...data, doc_application_letter, doc_pds, doc_wes, doc_diploma, doc_tor, doc_ipcr },
        { onSuccess: () => setDialogOpen(false) }
      );
    } catch (e: any) {
      toast.error("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (data: FormData, docs: DocFiles) => {
    if (!editing) return;
    setUploading(true);
    try {
      const docUpdates: Record<string, string> = {};
      await Promise.all(
        DOC_LABELS.map(async ({ key }) => {
          const file = docs[key];
          if (file) {
            const url = await uploadApplicantDoc(data.name || editing.name, key, file);
            docUpdates[`doc_${key}`] = url;
          }
        })
      );
      updateMut.mutate(
        { id: editing.id, ...data, ...docUpdates },
        { onSuccess: () => { setEditing(null); setDialogOpen(false); } }
      );
    } catch (e: any) {
      toast.error("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  // Sort: active first, then dns/withdrawn last
  const sortedApplicants = [...(applicants || [])].sort((a, b) => {
    const aInactive = a.status === "dns" || a.status === "withdrawn";
    const bInactive = b.status === "dns" || b.status === "withdrawn";
    if (aInactive && !bInactive) return 1;
    if (!aInactive && bInactive) return -1;
    return 0;
  });

  const positions = Array.from(
    new Set((applicants || []).map((a) => a.position_applied).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b));
  const activePosition = positionFilter ?? positions[0] ?? "all";
  const q = search.trim().toLowerCase();

  const filteredApplicants = sortedApplicants.filter((a) => {
    if (activePosition !== "all" && a.position_applied !== activePosition) return false;
    const st = a.status ?? "active";
    if (statusFilter !== "all" && st !== statusFilter) return false;
    if (q && !`${a.name} ${a.office ?? ""} ${a.previous_position ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <AppLayout>
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Applicants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalApplicants}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assessments Done</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAssessed} <span className="text-sm font-normal text-muted-foreground">/ {activeApplicants.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Interviews Done</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalInterviewed} <span className="text-sm font-normal text-muted-foreground">/ {activeApplicants.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Applicants Table ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Applicants</CardTitle>
          {isSuperAdmin && (
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Applicant</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Applicant" : "Add Applicant"}</DialogTitle>
                </DialogHeader>
                {uploading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Uploading documents, please wait…</p>
                  </div>
                ) : (
                  <ApplicantForm
                    initial={editing ? {
                      name: editing.name, previous_position: editing.previous_position,
                      position_applied: editing.position_applied, salary_grade: editing.salary_grade,
                      eligibility: editing.eligibility, office: editing.office,
                      contact: editing.contact, email: editing.email,
                      vacant_positions: editing.vacant_positions || "",
                    } : emptyForm}
                    existingDocs={editing ? {
                      doc_application_letter: editing.doc_application_letter,
                      doc_pds: editing.doc_pds, doc_wes: editing.doc_wes,
                      doc_diploma: editing.doc_diploma, doc_tor: editing.doc_tor,
                      doc_ipcr: editing.doc_ipcr,
                    } : undefined}
                    onSubmit={editing ? handleUpdate : handleCreate}
                    onClose={() => { setDialogOpen(false); setEditing(null); }}
                    existingApplicants={applicants || []}
                    isEditing={!!editing}
                  />
                )}
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>

        <CardContent>
          {!!applicants?.length && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Input className="w-full sm:w-64" placeholder="Search name, office..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
              <select value={activePosition} onChange={(e) => setPositionFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm max-w-xs">
                <option value="all">All positions</option>
                {positions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="dns">Did Not Show Up</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
              <span className="text-sm text-muted-foreground self-center">
                {filteredApplicants.length} of {totalApplicants}
              </span>
            </div>
          )}
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : !applicants?.length ? (
            <p className="text-muted-foreground text-center py-8">No applicants yet. Add one to get started.</p>
          ) : !filteredApplicants.length ? (
            <p className="text-muted-foreground text-center py-8">No applicants match the filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position Applied</TableHead>
                    <TableHead>SG</TableHead>
                    <TableHead>Present Position</TableHead>
                    <TableHead>Office</TableHead>
                    <TableHead>Status</TableHead>
                    {isSuperAdmin && <TableHead>Attendance</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplicants.map((a, idx) => {
                    const isDns       = a.status === "dns";
                    const isWithdrawn = a.status === "withdrawn";
                    const isInactive  = isDns || isWithdrawn;

                    const rowBg        = isDns ? "#fef2f2" : isWithdrawn ? "#faf5ff" : undefined;
                    const strikeColor  = isDns ? "#dc2626" : isWithdrawn ? "#7c3aed" : undefined;
                    const badgeLabel   = isDns ? "DNS" : "WD";
                    const badgeColor   = isDns ? "#dc2626" : "#7c3aed";

                    return (
                      <TableRow
                        key={a.id}
                        style={{
                          background: rowBg,
                          opacity: isInactive ? 0.75 : 1,
                        }}
                      >
                        <TableCell style={{ color: strikeColor }}>
                          {idx + 1}
                        </TableCell>
                        <TableCell
                          className="font-medium"
                          style={{
                            textDecoration: isInactive ? "line-through" : "none",
                            color: strikeColor,
                          }}
                        >
                          {a.name}
                          {isInactive && (
                            <span style={{
                              marginLeft: 6, fontSize: "10px", fontWeight: 600,
                              color: badgeColor, textDecoration: "none", display: "inline-block",
                            }}>
                              {badgeLabel}
                            </span>
                          )}
                        </TableCell>
                        <TableCell style={{ textDecoration: isInactive ? "line-through" : "none", color: strikeColor }}>
                          {a.position_applied}
                        </TableCell>
                        <TableCell style={{ color: strikeColor }}>{a.salary_grade || "—"}</TableCell>
                        <TableCell style={{ color: strikeColor }}>{a.previous_position || "—"}</TableCell>
                        <TableCell style={{ color: strikeColor }}>{a.office || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge variant={a.has_assessment ? "default" : "secondary"} className="text-xs">
                              {a.has_assessment ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                              Form 3
                            </Badge>
                            {!isSuperAdmin && <InterviewProgress applicant={a} />}
                          </div>
                        </TableCell>

                        {/* ── Attendance Dropdown — superadmin only ── */}
                        {isSuperAdmin && (
                          <TableCell>
                            <StatusDropdown applicant={a} />
                          </TableCell>
                        )}

                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/assessment/${a.id}`} title="Form 3">
                                <FileText className="h-4 w-4" />
                              </Link>
                            </Button>
                            {!isSuperAdmin && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/interview/${a.id}`} title="Form 4">
                                  <ClipboardList className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            <DocumentsDialog applicant={a} />
                            {isSuperAdmin && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => { setEditing(a); setDialogOpen(true); }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete applicant?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will also delete their assessment, interview, and document data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteMut.mutate(a.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}

