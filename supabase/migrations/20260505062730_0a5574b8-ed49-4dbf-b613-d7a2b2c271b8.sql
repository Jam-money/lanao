
-- Applicants table
CREATE TABLE public.applicants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  previous_position TEXT,
  position_applied TEXT NOT NULL,
  salary_grade TEXT,
  eligibility TEXT,
  office TEXT,
  contact TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to applicants" ON public.applicants
  FOR ALL USING (true) WITH CHECK (true);

-- Assessments table (Form 3)
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  education_pts NUMERIC DEFAULT 0,
  education_degree TEXT,
  education_course TEXT,
  training_pts NUMERIC DEFAULT 0,
  training_name TEXT,
  training_hours NUMERIC DEFAULT 0,
  experience_pts NUMERIC DEFAULT 0,
  experience_name TEXT,
  experience_duration TEXT,
  experience_years NUMERIC DEFAULT 0,
  eligibility_pts NUMERIC DEFAULT 0,
  evaluated_by TEXT,
  reviewed_by TEXT,
  attested_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(applicant_id)
);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to assessments" ON public.assessments
  FOR ALL USING (true) WITH CHECK (true);

-- Interviews table (Form 4)
CREATE TABLE public.interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  c1 INTEGER DEFAULT 0 CHECK (c1 >= 0 AND c1 <= 4),
  c2 INTEGER DEFAULT 0 CHECK (c2 >= 0 AND c2 <= 4),
  c3 INTEGER DEFAULT 0 CHECK (c3 >= 0 AND c3 <= 4),
  c4 INTEGER DEFAULT 0 CHECK (c4 >= 0 AND c4 <= 4),
  c5 INTEGER DEFAULT 0 CHECK (c5 >= 0 AND c5 <= 4),
  c6 INTEGER DEFAULT 0 CHECK (c6 >= 0 AND c6 <= 4),
  c7 INTEGER DEFAULT 0 CHECK (c7 >= 0 AND c7 <= 4),
  c8 INTEGER DEFAULT 0 CHECK (c8 >= 0 AND c8 <= 4),
  c9 INTEGER DEFAULT 0 CHECK (c9 >= 0 AND c9 <= 4),
  c10 INTEGER DEFAULT 0 CHECK (c10 >= 0 AND c10 <= 4),
  rated_by TEXT,
  interview_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(applicant_id)
);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to interviews" ON public.interviews
  FOR ALL USING (true) WITH CHECK (true);
