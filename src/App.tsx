import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";

// --- CORE PAGE IMPORTS ---
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import Profile from "./pages/Profile";
import Network from "./pages/Network";
import Settings from "./pages/Settings"; // This component must now render an <Outlet />
import Messages from "./pages/Messages";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import MyApplications from "./pages/MyApplications";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";

// --- NEW IMPORTS FOR SETTINGS SUB-PAGES ---
import EditProfile from "./pages/Settings/EditProfile"; // 👈 NEWLY IMPORTED COMPONENT

// Create QueryClient with global error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (error instanceof Error && error.message === 'Not authenticated') {
          return false;
        }
        return failureCount < 2;
      },
      // Disable aggressive refetching to avoid rate limits
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* Protected Routes - Require Authentication */}
            <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/my-applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/network" element={<ProtectedRoute><Network /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
            <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
            
            {/* 🎯 NESTED SETTINGS ROUTES (New Structure) - Protected */}
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>}> 
              <Route index element={<EditProfile />} /> 
              <Route path="edit-profile" element={<EditProfile />} /> 
            </Route>

            {/* Catch-all Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;