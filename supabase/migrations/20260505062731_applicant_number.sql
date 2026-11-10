-- Add applicant number sequence
CREATE SEQUENCE IF NOT EXISTS public.applicant_number_seq;

-- Add applicant_number column to applicants table
ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS applicant_number INTEGER DEFAULT nextval('public.applicant_number_seq');

-- Set sequence to start from current max value if there are existing records
SELECT setval('public.applicant_number_seq', COALESCE((SELECT MAX(applicant_number) FROM public.applicants), 0));
