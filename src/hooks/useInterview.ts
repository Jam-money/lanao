import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type Interview = {
  id: string;
  applicant_id: string;
  c1: number; c2: number; c3: number; c4: number; c5: number;
  c6: number; c7: number; c8: number; c9: number; c10: number;
  rated_by: string | null;
  interview_date: string | null;
  user_id: string | null;
  office_id?: string | null;
};

export function useInterview(applicantId: string) {
  const { user, officeId } = useAuth();
  return useQuery({
    queryKey: ["interview", applicantId, user?.id, officeId],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("applicant_id", applicantId)
        .eq("user_id", user.id)
        .eq("office_id", officeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!applicantId && !!user?.id && !!officeId,
  });
}

export function useSaveInterview() {
  const qc = useQueryClient();
  const { user, officeId } = useAuth();
  return useMutation({
    mutationFn: async (data: Omit<Interview, "id"> & { id?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const dataWithUser = { ...data, user_id: user.id, office_id: officeId };
      const { id, ...upsertData } = dataWithUser as typeof dataWithUser & { id?: string };
      const { error } = await supabase
        .from("interviews")
        .upsert(upsertData, { onConflict: "applicant_id,user_id" });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["interview", vars.applicant_id] });
      qc.invalidateQueries({ queryKey: ["applicants"] });
      qc.invalidateQueries({ queryKey: ["rankings"] });
      toast.success("Interview saved");
    },
    onError: (e) => toast.error(e.message),
  });
}