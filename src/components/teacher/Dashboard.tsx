import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Copy, Clock, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { toast } from "sonner";

interface Quiz {
  id: string;
  title: string;
  description: string;
  created_at: string;
  questions_per_quiz: number;
  duration_minutes: number;
}

export function TeacherDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadQuizzes() {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setQuizzes(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function duplicateQuiz(quiz: Quiz) {
    setDuplicating(quiz.id);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .single();

      if (!profile) throw new Error("Profile not found");

      const newQuiz = {
        title: `${quiz.title} (copy)`,
        description: `${quiz.description} (copy)`,
        duration_minutes: quiz.duration_minutes,
        questions_per_quiz: quiz.questions_per_quiz,
        created_by: profile.id,
      };

      const { error } = await supabase
        .from("quizzes")
        .insert([newQuiz])
        .select()
        .single();

      if (!error) {
        loadQuizzes();
      }
      setDuplicating(null);
    } catch (error) {}
  }

  async function deleteQuiz(quizId: string) {
    setDeleting(quizId);
    try {
      // Get all attempts for this quiz
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("id")
        .eq("quiz_id", quizId);

      if (attempts) {
        // Delete all question responses for these attempts
        for (const attempt of attempts) {
          await supabase
            .from("question_responses")
            .delete()
            .eq("attempt_id", attempt.id);
        }
      }

      // Delete all attempts
      await supabase.from("quiz_attempts").delete().eq("quiz_id", quizId);

      // Delete all quiz questions
      await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);

      // Delete all questions
      await supabase.from("questions").delete().eq("quiz_id", quizId);

      // Finally, delete the quiz
      const { error } = await supabase.from("quizzes").delete().eq("id", quizId);

      if (error) throw error;

      toast.success("Quiz deleted successfully");
      setQuizzes((prevQuizzes) => prevQuizzes.filter((q) => q.id !== quizId));
    } catch (error: any) {
      toast.error("Failed to delete quiz", {
        description: error.message,
      });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">My Quizzes</h1>
        <Link to="/quiz/create">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No quizzes created yet.</p>
          <Link
            to="/quiz/create"
            className="text-primary hover:underline mt-2 inline-block"
          >
            Create your first quiz
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="group bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {quiz.title}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(quiz.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {quiz.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{quiz.questions_per_quiz} questions</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{quiz.duration_minutes} min</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link to={`/quiz/${quiz.id}/results`} className="col-span-2">
                    <Button variant="secondary" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      View Attempts
                    </Button>
                  </Link>
                  <Link to={`/quiz/${quiz.id}`}>
                    <Button variant="outline" className="w-full">
                      Edit Quiz
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => duplicateQuiz(quiz)}
                    disabled={duplicating === quiz.id}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {duplicating === quiz.id ? "Duplicating..." : "Duplicate"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full col-span-2 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Quiz
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete
                          the quiz and all associated data including:
                          <ul className="list-disc list-inside mt-2">
                            <li>All questions</li>
                            <li>All student attempts</li>
                            <li>All responses and results</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteQuiz(quiz.id)}
                          className="bg-red-500 hover:bg-red-600"
                          disabled={deleting === quiz.id}
                        >
                          {deleting === quiz.id ? "Deleting..." : "Delete Quiz"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}