import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';

// These paths assume App.tsx is inside src/app/
// and your components are in src/app/components/
import { LoginForm } from "./components/LoginForm";
import StudentDashboard from "./pages/StudentDashboard";
import ManagerDashboard from "./pages/MessManagerDashboard";

// Helper component to protect routes by role
function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (role !== allowedRole) {
    // If wrong role, redirect to their own dashboard
    return <Navigate to={role === 'manager' ? "/manager-dashboard" : "/student-dashboard"} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Routes>
          {/* Main Login / Registration Page */}
          <Route path="/" element={<LoginForm />} />
          
          {/* Dashboards - Protected by Role */}
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manager-dashboard" 
            element={
              <ProtectedRoute allowedRole="manager">
                <ManagerDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Default route sends everyone to the login page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}