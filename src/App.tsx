import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import NotificationListener from "./components/NotificationListener";
import Index from "./pages/Index";

const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profiles = lazy(() => import("./pages/Profiles"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminChat = lazy(() => import("./pages/AdminChat"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Matches = lazy(() => import("./pages/Matches"));
const UserNotifications = lazy(() => import("./pages/UserNotifications"));
const Settings = lazy(() => import("./pages/Settings"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
    Chargement...
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NotificationListener />
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin-chat" element={<AdminChat />} />
              <Route path="/admin-notifications" element={<AdminNotifications />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/notifications" element={<UserNotifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
