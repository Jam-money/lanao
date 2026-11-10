import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import background from "@/assets/backless.jpg";
import phLogo from "@/assets/PH.png";
import psaLogo from "@/assets/PSA.png";
import ascendLogo from "@/assets/ascend.png";

const PRIVACY_NOTICE = [
  {
    title: "Collection of Personal Data",
    body: "The PSA collects personal information voluntarily provided by users who register, access, and submit applications through PSA A.S.C.E.N.D. The personal data collected may include, but are not limited to, the following:",
    items: [
      "Full name and other personal identification details",
      "Contact information such as email address and mobile number",
      "Educational background and professional qualifications",
      "Employment history, eligibility, training, and supporting documents",
      "Login credentials and system-generated information such as access logs and activity records",
    ],
  },
  {
    title: "Purpose of Processing",
    body: "The personal data collected through PSA A.S.C.E.N.D. shall be processed for legitimate and lawful purposes, including:",
    items: [
      "User registration and authentication",
      "Processing and evaluation of applications for vacant positions in the PSA",
      "Verification and validation of submitted credentials and qualifications",
      "Facilitation of recruitment, selection, appointment, and placement processes",
      "Communication regarding application status, schedules, and recruitment updates",
      "Generation of records, reports, and personnel-related documentation",
      "Maintenance, monitoring, and improvement of the system and related services",
    ],
  },
  {
    title: "Data Protection and Security",
    body: "The PSA implements appropriate organizational, physical, and technical security measures to safeguard personal data against unauthorized access, disclosure, alteration, misuse, loss, or destruction. Access to personal information is limited only to authorized personnel who require such information in the performance of their official duties.",
    items: [],
  },
  {
    title: "Data Sharing and Disclosure",
    body: "Personal data collected through PSA A.S.C.E.N.D. shall not be disclosed or shared with third parties except when authorized by law, required by competent authorities, or with the consent of the data subject.",
    items: [],
  },
  {
    title: "Retention of Information",
    body: "Personal data shall be retained only for as long as necessary to fulfill the declared purposes and in accordance with applicable laws, rules, regulations, and records retention policies of the PSA.",
    items: [],
  },
  {
    title: "Rights of the Data Subject",
    body: "Pursuant to the Data Privacy Act of 2012, data subjects have the right to:",
    items: [
      "Be informed regarding the processing of their personal data",
      "Access and request a copy of their personal data",
      "Correct or update inaccurate or incomplete information",
      "Object to or withdraw consent for processing, subject to applicable limitations",
      "Request the suspension, withdrawal, or deletion of personal data when applicable",
    ],
  },
  {
    title: "Contact Information",
    body: "For inquiries, concerns, or requests regarding personal data and privacy matters, you may contact:",
    items: [
      "Data Protection Officer, Philippine Statistics Authority",
    ],
  },
];

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyChecked) {
      toast.error("Please agree to the Privacy Notice before signing in.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message); return; }
      toast.success("Login successful!");
      navigate("/");
    } catch {
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-white/90">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-4">
            <img src={psaLogo} alt="PSA Logo" className="h-20 w-20 object-contain" />
            <img src={phLogo} alt="Philippine Government Logo" className="h-20 w-20 object-contain" />
            
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">PSA A.S.C.E.N.D</CardTitle>
            <div className="mt-3 rounded-md bg-primary/5 border border-primary/20 px-3 py-2.5">
              <div className="flex flex-wrap gap-x-1 gap-y-0.5 items-baseline">
                {[
                  ["A", "dministrative and"],
                  ["S", "upport Services"],
                  ["C", "entralized"],
                  ["E", "nterprise"],
                  ["N", "etwork and"],
                  ["D", "igitalization"],
                ].map(([letter, rest]) => (
                  <span key={letter} className="text-xs whitespace-nowrap">
                    <span className="font-bold text-primary text-sm">{letter}</span>
                    <span className="text-muted-foreground">{rest}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                id="privacy"
                type="checkbox"
                checked={privacyChecked}
                onChange={(e) => setPrivacyChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
              />
              <label htmlFor="privacy" className="text-sm text-muted-foreground leading-snug">
                I have read and agree to the{" "}
                <button
                  type="button"
                  onClick={() => setPrivacyOpen(true)}
                  className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium"
                >
                  Privacy Notice
                </button>
              </label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !privacyChecked}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* ── Privacy Notice Modal ── */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Privacy Notice</DialogTitle>
          </DialogHeader>

          <div className="space-y-1 pb-1">
            <p className="text-sm font-semibold text-muted-foreground">PSA A.S.C.E.N.D.</p>
            <p className="text-sm font-medium text-muted-foreground">
              Administrative and Support Services Centralized Enterprise Network and Digitalization
            </p>
            <p className="text-sm mt-2">
              The <strong>Philippine Statistics Authority (PSA)</strong> respects and values your privacy
              and is committed to protecting your personal data in accordance with the provisions of
              Data Privacy Act of 2012 and the issuances of the National Privacy Commission.
            </p>
          </div>

          <hr className="my-2" />

          {PRIVACY_NOTICE.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="font-semibold text-sm">{section.title}</h3>
              <p className="text-sm">{section.body}</p>
              {section.items.length > 0 && (
                <ul className="list-disc pl-5 space-y-1">
                  {section.items.map((item) => (
                    <li key={item} className="text-sm">{item}</li>
                  ))}
                </ul>
              )}
              <hr className="my-2" />
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => { setPrivacyChecked(true); setPrivacyOpen(false); }}
              className="px-8"
            >
              I Agree
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;