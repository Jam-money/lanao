import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type Applicant = {
  id: string;
  applicant_number?: number;
  name: string;
  previous_position: string | null;
  position_applied: string;
  salary_grade: string | null;
  eligibility: string | null;
  office: string | null;
  contact: string | null;
  email: string | null;
  vacant_positions?: string;
  created_at: string;
  office_id?: string | null;
  status?: "active" | "dns" | "withdrawn" | null;
  has_assessment?: boolean;
  has_interview?: boolean;
  interview_count?: number;
  interviewer_ids?: string[];
  doc_application_letter?: string | null;
  doc_pds?: string | null;
  doc_wes?: string | null;
  doc_diploma?: string | null;
  doc_tor?: string | null;
  doc_ipcr?: string | null;
};

const TOTAL_INTERVIEW_ACCOUNTS = 4;
export { TOTAL_INTERVIEW_ACCOUNTS };

export async function uploadApplicantDoc(
  applicantName: string,
  docType: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const safeName = applicantName.replace(/[^a-zA-Z0-9]/g, "_");
  const path = `${safeName}/${docType}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("applicant-documents")
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("applicant-documents").getPublicUrl(path);
  return data.publicUrl;
}

export function useApplicants() {
  const { user, officeId } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("realtime-applicants")
      .on("postgres_changes", { event: "*", schema: "public", table: "applicants" }, () => {
        qc.invalidateQueries({ queryKey: ["applicants"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "assessments" }, () => {
        qc.invalidateQueries({ queryKey: ["applicants"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "interviews" }, () => {
        qc.invalidateQueries({ queryKey: ["applicants"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  return useQuery({
    queryKey: ["applicants", user?.id, officeId],
    queryFn: async () => {
      const { data: applicants, error } = await supabase
        .from("applicants")
        .select("*")
        .eq("office_id", officeId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: assessments } = await supabase
        .from("assessments")
        .select("applicant_id")
        .eq("office_id", officeId);

      const { data: allInterviews } = await supabase
        .from("interviews")
        .select("applicant_id, user_id")
        .eq("office_id", officeId);

      const { data: myInterviews } = await supabase
        .from("interviews")
        .select("applicant_id")
        .eq("user_id", user?.id)
        .eq("office_id", officeId);

      const assessmentSet = new Set(assessments?.map((a) => a.applicant_id));
      const myInterviewSet = new Set(myInterviews?.map((i) => i.applicant_id));

      const interviewCountMap = new Map<string, number>();
      for (const interview of allInterviews || []) {
        const prev = interviewCountMap.get(interview.applicant_id) || 0;
        interviewCountMap.set(interview.applicant_id, prev + 1);
      }

      const interviewerMap = new Map<string, string[]>();
      for (const i of allInterviews || []) {
        if (!i.user_id) continue;
        interviewerMap.set(i.applicant_id, [...(interviewerMap.get(i.applicant_id) || []), i.user_id]);
      }

      return (applicants || []).map((a) => ({
        ...a,
        interviewer_ids: interviewerMap.get(a.id) || [],
        has_assessment: assessmentSet.has(a.id),
        has_interview: myInterviewSet.has(a.id),
        interview_count: interviewCountMap.get(a.id) || 0,
      })) as Applicant[];
    },
    enabled: !!user?.id && !!officeId,
  });
}

export function useCreateApplicant() {
  const qc = useQueryClient();
  const { officeId } = useAuth();
  return useMutation({
    mutationFn: async (data: Omit<Applicant, "id" | "created_at" | "has_assessment" | "has_interview" | "interview_count" | "interviewer_ids">) => {
      const { error } = await supabase.from("applicants").insert({
        ...data,
        office_id: officeId,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applicants"] });
      toast.success("Applicant added");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateApplicant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, applicant_number, has_assessment, has_interview, interview_count, ...data }: Partial<Applicant> & { id: string }) => {
      const { error } = await supabase.from("applicants").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applicants"] });
      toast.success("Applicant updated");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateApplicantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "dns" | "withdrawn" }) => {
      const { error } = await supabase.from("applicants").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["applicants"] });
      qc.invalidateQueries({ queryKey: ["rankings"] });
      toast.success(
        vars.status === "dns"
          ? "Marked as Did Not Show Up"
          : vars.status === "withdrawn"
          ? "Marked as Withdrawn"
          : "Marked as Active"
      );
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteApplicant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete related records first to avoid foreign key conflicts
      const { error: assessmentError } = await supabase
        .from("assessments")
        .delete()
        .eq("applicant_id", id);
      
      if (assessmentError) throw assessmentError;

      const { error: interviewError } = await supabase
        .from("interviews")
        .delete()
        .eq("applicant_id", id);
      
      if (interviewError) throw interviewError;

      // Then delete the applicant
      const { error } = await supabase.from("applicants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applicants"] });
      qc.invalidateQueries({ queryKey: ["rankings"] });
      toast.success("Applicant deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}
