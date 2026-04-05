import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { AntiScreenshot } from "./components/AntiScreenshot";
import NotificationListener from "./components/NotificationListener";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Profiles from "./pages/Profiles.tsx";
import Admin from "./pages/Admin.tsx";
import AdminChat from "./pages/AdminChat.tsx";
import AdminNotifications from "./pages/AdminNotifications.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <AntiScreenshot />
        <Toaster />
        <Sonner />
        <NotificationListener />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin-chat" element={<AdminChat />} />
            <Route path="/admin-notifications" element={<AdminNotifications />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
