import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Transactions from "./pages/Transactions";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import GoogleCallback from "./pages/GoogleCallback";
import HealthCheck from "./pages/HealthCheck";
import UpdatePassword from "./pages/UpdatePassword";
import EnvironmentGate from "./components/EnvironmentGate";
import GoogleLoginHelp from "./pages/GoogleLoginHelp";

const queryClient = new QueryClient();

const App = () => (
  <EnvironmentGate>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/health" element={<HealthCheck />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/google-login-help" element={<GoogleLoginHelp />} />
            
            <Route 
              path="/" 
              element={<ProtectedRoute><Index /></ProtectedRoute>} 
            />
            <Route 
              path="/transactions" 
              element={<ProtectedRoute><Transactions /></ProtectedRoute>} 
            />
            <Route 
              path="/upload" 
              element={<ProtectedRoute><Upload /></ProtectedRoute>} 
            />
            <Route 
              path="/profile" 
              element={<ProtectedRoute><Profile /></ProtectedRoute>} 
            />
            <Route 
              path="/admin" 
              element={<AdminRoute><Admin /></AdminRoute>} 
            />
            <Route path="/google-callback" element={<GoogleCallback />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </EnvironmentGate>
);

export default App;