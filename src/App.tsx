import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';
import { MainLayout } from './layouts/MainLayout';
import { AboutPage } from './pages/AboutPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { BooksPage } from './pages/BooksPage';
import { GoogleDrivePage } from './pages/GoogleDrivePage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { QuizPage } from './pages/QuizPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { TeacherDashboardPage } from './pages/TeacherDashboardPage';
import { UserRole } from './types';

function RequireRole({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}) {
  const { firebaseUser, appUser, authReady } = useAuth();

  if (!authReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        Memeriksa sesi pengguna...
      </div>
    );
  }

  if (!firebaseUser || !appUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(appUser.role)) {
    const target =
      appUser.role === 'admin'
        ? '/dashboard/admin'
        : appUser.role === 'guru'
          ? '/dashboard/guru'
          : '/dashboard/siswa';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/buku-digital" element={<BooksPage />} />
                  <Route path="/quiz" element={<QuizPage />} />
                  <Route path="/prestasi" element={<AchievementsPage />} />
                  <Route path="/google-drive" element={<GoogleDrivePage />} />
                  <Route path="/tentang" element={<AboutPage />} />
                  <Route path="/login" element={<LoginPage />} />

                  <Route
                    path="/dashboard/siswa"
                    element={
                      <RequireRole allowedRoles={['siswa', 'guru', 'admin']}>
                        <StudentDashboardPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/dashboard/guru"
                    element={
                      <RequireRole allowedRoles={['guru', 'admin']}>
                        <TeacherDashboardPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/dashboard/admin"
                    element={
                      <RequireRole allowedRoles={['admin']}>
                        <AdminDashboardPage />
                      </RequireRole>
                    }
                  />

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </MainLayout>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
