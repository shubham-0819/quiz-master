import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/auth";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SignIn } from "@/components/auth/SignIn";
import { SignUp } from "@/components/auth/SignUp";
import { TeacherDashboard } from "@/components/teacher/Dashboard";
import { StudentDashboard } from "@/components/student/Dashboard";
import { CreateQuiz } from "@/components/teacher/CreateQuiz";
import { QuizQuestions } from "@/components/teacher/QuizQuestions";
import { TakeQuiz } from "@/components/student/TakeQuiz";
import { QuizResults } from "@/components/student/QuizResults";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((user) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route element={<AuthLayout />}>
            <Route
              path="/signin"
              element={
                !user ? <SignIn setUser={setUser} /> : <Navigate to="/dashboard" replace />
              }
            />
            <Route
              path="/signup"
              element={
                !user ? <SignUp /> : <Navigate to="/dashboard" replace />
              }
            />
          </Route>

          {/* Protected routes */}
          <Route element={<DashboardLayout user={user} />}>
            <Route
              path="/dashboard"
              element={
                user?.profile?.role === "teacher" ? (
                  <TeacherDashboard />
                ) : (
                  <StudentDashboard />
                )
              }
            />
            <Route
              path="/quiz/create"
              element={
                user?.profile?.role === "teacher" ? (
                  <CreateQuiz />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route
              path="/quiz/:quizId/questions"
              element={
                user?.profile?.role === "teacher" ? (
                  <QuizQuestions />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route
              path="/quiz/:quizId"
              element={
                user?.profile?.role === "student" ? (
                  <TakeQuiz />
                ) : (
                  <QuizQuestions />
                )
              }
            />
            <Route
              path="/quiz/:quizId/results"
              element={
                user ? <QuizResults /> : <Navigate to="/signin" replace />
              }
            />
          </Route>

          {/* Fallback route */}
          <Route
            path="*"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/signin" replace />
              )
            }
          />
        </Routes>
      </Router>
      <Toaster />
    </>
  );
}
