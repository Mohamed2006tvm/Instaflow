import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore.js';
import { authApi } from './services/api.js';
import AppLayout from './layouts/AppLayout.jsx';
import LoginPage from './pages/Login.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import AutomationsPage from './pages/Automations.jsx';
import AutomationFormPage from './pages/AutomationForm.jsx';
import LogsPage from './pages/Logs.jsx';
import AccountPage from './pages/Account.jsx';
import SettingsPage from './pages/Settings.jsx';

function ProtectedRoute({ children }) {
  const { admin, isLoading } = useAuthStore();
  if (isLoading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
  return admin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { setAdmin, clearAdmin, setLoading } = useAuthStore();

  useEffect(() => {
    authApi.me()
      .then(res => setAdmin(res.data.data))
      .catch(() => { clearAdmin(); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="automations" element={<AutomationsPage />} />
          <Route path="automations/new" element={<AutomationFormPage />} />
          <Route path="automations/:id/edit" element={<AutomationFormPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
