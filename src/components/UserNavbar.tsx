import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, Bell, LogOut, Shield, Menu, User, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const UserNavbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const unreadNotifs = useUnreadNotifications();
  const unreadMsgs = useUnreadMessages();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const navItems = [
    { path: "/profiles", label: "Profils", icon: Home },
    { path: "/inbox", label: "Messages", icon: MessageCircle, badge: unreadMsgs },
    { path: "/notifications", label: "Notifications", icon: Bell, badge: unreadNotifs },
    { path: "/profile/edit", label: "Mon Profil", icon: User },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <a href="/" className="text-xl font-semibold tracking-wide">
          <span className="text-primary font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Rencontre</span>
          <span className="text-foreground font-light">DeLuxe</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <Button
              key={item.path}
              size="sm"
              variant={location.pathname === item.path ? "secondary" : "ghost"}
              onClick={() => navigate(item.path)}
              className="relative text-muted-foreground"
            >
              <item.icon className="w-4 h-4 mr-1" />
              {item.label}
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </Button>
          ))}
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={() => navigate("/admin")} className="rounded-full border-primary/30 text-primary">
              <Shield className="w-4 h-4 mr-1" /> Admin
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={signOut} className="text-muted-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center gap-2">
          {/* Quick badges */}
          <Button size="sm" variant="ghost" onClick={() => navigate("/inbox")} className="relative p-2">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
            {unreadMsgs > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                {unreadMsgs > 9 ? "9+" : unreadMsgs}
              </span>
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate("/notifications")} className="relative p-2">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                {unreadNotifs > 9 ? "9+" : unreadNotifs}
              </span>
            )}
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card border-border/50 p-0">
              <div className="p-6 border-b border-border/50">
                <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Menu</p>
              </div>
              <div className="p-3 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                      location.pathname === item.path
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </button>
                ))}
                {isAdmin && (
                  <button
                    onClick={() => { navigate("/admin"); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Shield className="w-4 h-4 shrink-0" /> Administration
                  </button>
                )}
              </div>
              <div className="p-3 border-t border-border/50">
                <button
                  onClick={() => { signOut(); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <LogOut className="w-4 h-4 shrink-0" /> Déconnexion
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default UserNavbar;
