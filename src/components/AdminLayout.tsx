import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Users, MessageCircle, Bell, ArrowLeft, Crown } from "lucide-react";

const adminRoutes = [
  { path: "/admin", label: "Gestion des Profils", icon: Users },
  { path: "/admin-chat", label: "Messagerie Admin", icon: MessageCircle },
  { path: "/admin-notifications", label: "Notifications Push", icon: Bell },
  { path: "/admin-subscriptions", label: "Abonnements", icon: Crown },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-card border-border/50 p-0">
              <div className="p-6 border-b border-border/50">
                <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Administration
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Panneau de contrôle</p>
              </div>
              <div className="p-3 space-y-1">
                {adminRoutes.map((route) => {
                  const isActive = location.pathname === route.path;
                  return (
                    <button
                      key={route.path}
                      onClick={() => { navigate(route.path); setOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      <route.icon className="w-4 h-4 shrink-0" />
                      {route.label}
                    </button>
                  );
                })}
              </div>
              <div className="p-3 mt-auto border-t border-border/50">
                <button
                  onClick={() => { navigate("/profiles"); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  Retour au site
                </button>
              </div>
            </SheetContent>
          </Sheet>

          <span className="text-lg font-semibold text-foreground flex-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            <span className="text-primary">Rencontre</span>DeLuxe Admin
          </span>

          <Button variant="ghost" size="sm" onClick={() => navigate("/profiles")} className="text-muted-foreground text-xs">
            <ArrowLeft className="w-3 h-3 mr-1" /> Site
          </Button>
        </div>
      </nav>
      <div className="pt-16">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
