
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientHome from "./pages/PatientHome";
import DoctorHome from "./pages/DoctorHome";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import Chat from "./pages/Chat";
import Map from "./pages/Map";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import PatientComplaints from "./pages/PatientComplaints";

// Create a query client
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<AdminLogin />} />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/dashboard/:section" element={<AdminDashboard />} />
              
              {/* Patient Routes */}
              <Route path="/patient/dashboard" element={<PatientHome section="dashboard" />} />
              <Route path="/patient/doctors" element={<PatientHome section="doctors" />} />
              <Route path="/patient/symptom-checker" element={<PatientHome section="symptom-checker" />} />
              <Route path="/patient/appointments" element={<PatientHome section="appointments" />} />
              <Route path="/patient/appointments/new" element={<PatientHome section="appointments" />} />
              <Route path="/patient/medication-refills" element={<PatientHome section="medication-refills" />} />
              <Route path="/patient/complaints" element={<PatientHome section="complaints" />} />
              <Route path="/patient/complaints/new" element={<PatientHome section="new-complaint" />} />
              <Route path="/patient/sos-emergency" element={<PatientHome section="sos-emergency" />} />
              <Route path="/patient/map" element={<PatientHome section="map" />} />
              <Route path="/patient/chat" element={<PatientHome section="chat" />} />
              <Route path="/patient/chat/:id" element={<Chat />} />
              <Route path="/patient/settings" element={<Settings />} />
              <Route path="/patient/profile" element={<Profile />} />
              
              {/* Doctor Routes */}
              <Route path="/doctor/dashboard" element={<DoctorHome section="dashboard" />} />
              <Route path="/doctor/patients" element={<DoctorHome section="patients" />} />
              <Route path="/doctor/appointments" element={<DoctorHome section="appointments" />} />
              <Route path="/doctor/appointments/new" element={<DoctorHome section="appointments" />} />
              <Route path="/doctor/chat" element={<DoctorHome section="chat" />} />
              <Route path="/doctor/chat/:id" element={<Chat />} />
              <Route path="/doctor/healthcare-alerts" element={<DoctorHome section="healthcare-alerts" />} />
              <Route path="/doctor/settings" element={<Settings />} />
              <Route path="/doctor/profile" element={<Profile />} />
              
              {/* Shared Chat Route - This handles both patient and doctor chat sessions */}
              <Route path="/chat/:id" element={<Chat />} />
              
              {/* Shared Routes */}
              <Route path="/map" element={<Map />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              
              {/* Catch-all Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          
          {/* Toasters */}
          <Toaster />
          <Sonner position="top-right" />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
