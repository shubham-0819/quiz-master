import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-lg shadow-sm border p-6 space-y-4"
            >
              <h3 className="font-semibold text-lg">{quiz.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {quiz.description}
              </p>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{quiz.questions_per_quiz} questions</span>
                <span>{quiz.duration_minutes} minutes</span>
              </div>
              <div className="flex gap-1 flex-row pt-4">
                <Link to={`/quiz/${quiz.id}`} className="w-1/2">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-1/2"
                  onClick={() => duplicateQuiz(quiz)}
                  disabled={duplicating === quiz.id}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {duplicating === quiz.id ? "Duplicating..." : "Duplicate"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
