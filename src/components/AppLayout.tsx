import { Link, useLocation, useNavigate } from "react-router-dom";
import { Users, Trophy, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ascendLogo from "@/assets/ascend.png";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/applicants", label: "Applicants", icon: Users },
  { path: "/rankings", label: "Form 6", icon: Trophy },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("An error occurred during logout");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary border-b border-primary/20 no-print">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img
                src={ascendLogo}
                alt="PSA A.S.C.E.N.D Logo"
                className="h-16 w-16 object-contain rounded-full"
              />
              <div>
                <h1 className="text-primary-foreground font-bold text-lg leading-tight">
                  PSA A.S.C.E.N.D
                </h1>
                <p className="text-primary-foreground/70 text-xs">
                  Region X – Northern Mindanao
                </p>
              </div>
            </Link>
            <nav className="flex items-center gap-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="flex items-center gap-3 border-l border-primary-foreground/20 pl-4">
                <div className="flex items-center gap-2 text-primary-foreground">
                  <User className="h-4 w-4" />
                  <div className="text-sm">
                    <div className="font-medium">{user?.email}</div>
                    <div className="text-xs text-primary-foreground/70 capitalize">{role}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}