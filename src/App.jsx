import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import LoadingSpinner from "./components/common/LoadingSpinner";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CoursesPage from "./pages/CoursesPage";
import NewCoursePage from "./pages/NewCoursePage";
import CourseDetailPage from "./pages/CourseDetailPage";
import RoadmapPage from "./pages/RoadmapPage";
import ModuleReaderPage from "./pages/ModuleReaderPage";
import ProgressPage from "./pages/ProgressPage";
import DebugPanel from "./pages/DebugPanel";
import StudyAssistantPage from "./pages/StudyAssistantPage";

function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <LoadingSpinner label="Loading workspace" />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/new" element={<NewCoursePage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/courses/:courseId/roadmap" element={<RoadmapPage />} />
        <Route path="/courses/:courseId/modules/:moduleId" element={<ModuleReaderPage />} />
        <Route path="/study-assistant" element={<StudyAssistantPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/debug" element={<DebugPanel />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
