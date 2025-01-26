import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LogOut,
  User,
  BookOpen,
  PlusCircle,
  BarChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function DashboardLayout({ user }: { user: any }) {
  const navigate = useNavigate();
  const isTeacher = user?.profile?.role === 'teacher';

  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (error: any) {
      toast.error('Failed to sign out', {
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/dashboard"
                className="flex-shrink-0 flex items-center text-indigo-600"
              >
                <GraduationCap className="h-8 w-8" />
                <span className="ml-2 text-xl font-bold">QuizMaster</span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {isTeacher ? 'My Quizzes' : 'Available Quizzes'}
                </Link>
                {isTeacher && (
                  <Link
                    to="/quiz/create"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Quiz
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {user?.profile?.full_name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}