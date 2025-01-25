import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CircularTimer } from "@/components/ui/CircularTimer";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Clock, AlertCircle } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  questions_per_quiz: number;
}

export function TakeQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [existingAttempt, setExistingAttempt] = useState<boolean>(false);

  useEffect(() => {
    async function loadQuiz() {
      if (!quizId) return;

      try {
        // Check if quiz is archived
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", quizId)
          .single();

        if (quizError) throw quizError;
        if (quizData.is_archived) {
          toast.error("This quiz is no longer available");
          navigate("/dashboard");
          return;
        }

        setQuiz(quizData);
        setTimeRemaining(quizData.duration_minutes * 60);

        // Check for existing attempt
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .single();

        if (profile) {
          const { data: attemptData } = await supabase
            .from("quiz_attempts")
            .select("*")
            .eq("quiz_id", quizId)
            .eq("student_id", profile.id)
            .maybeSingle();

          if (attemptData) {
            setExistingAttempt(true);
            navigate(`/quiz/${quizId}/results`);
            return;
          }
        }

        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", quizId)
          .order("created_at", { ascending: true });

        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);
      } catch (error: any) {
        toast.error("Failed to load quiz", {
          description: error.message,
        });
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [quizId, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizStarted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleQuizSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeRemaining]);

  const startQuiz = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .single();

      if (!profile) throw new Error("Profile not found");

      // Double-check for existing attempt before starting
      const { data: existingAttempt } = await supabase
        .from("quiz_attempts")
        .select("id")
        .eq("quiz_id", quizId)
        .eq("student_id", profile.id)
        .maybeSingle();
      console.log(existingAttempt);

      // check if attempt is submited or not check by completed_at if not remove the attempt details and question responses
      if (existingAttempt && existingAttempt.completed_at) {
        await supabase
          .from("quiz_attempts")
          .delete()
          .eq("id", existingAttempt.id);

        await supabase
          .from("question_responses")
          .delete()
          .eq("attempt_id", existingAttempt.id);
        return;
      }

      if (existingAttempt) {
        toast.error("You have already attempted this quiz");
        navigate(`/quiz/${quizId}/results`);
        return;
      }

      const { data: attempt, error } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: quizId,
          student_id: profile.id,
          total_questions: questions.length,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          toast.error("You have already attempted this quiz");
          navigate(`/quiz/${quizId}/results`);
          return;
        }
        throw error;
      }

      setAttemptId(attempt.id);
      setQuizStarted(true);
    } catch (error: any) {
      toast.error("Failed to start quiz", {
        description: error.message,
      });
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers({ ...answers, [currentQuestion.id]: optionIndex });
  };

  const handleNextQuestion = async () => {
    if (selectedOption === null) return;

    try {
      const currentQuestion = questions[currentQuestionIndex];
      await supabase.from("question_responses").insert({
        attempt_id: attemptId,
        question_id: currentQuestion.id,
        selected_option: selectedOption,
        is_correct: selectedOption === currentQuestion.correct_answer,
        time_taken_seconds: quiz!.duration_minutes * 60 - timeRemaining,
      });

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
      } else {
        handleQuizSubmit();
      }
    } catch (error: any) {
      toast.error("Failed to save answer", {
        description: error.message,
      });
    }
  };

  const handleQuizSubmit = async () => {
    try {
      const correctAnswers = Object.entries(answers).filter(
        ([questionId, answer]) => {
          const question = questions.find((q) => q.id === questionId);
          return question && answer === question.correct_answer;
        }
      ).length;

      await supabase
        .from("quiz_attempts")
        .update({
          completed_at: new Date().toISOString(),
          score: (correctAnswers / questions.length) * 100,
          correct_answers: correctAnswers,
        })
        .eq("id", attemptId);

      navigate(`/quiz/${quizId}/results`);
    } catch (error: any) {
      toast.error("Failed to submit quiz", {
        description: error.message,
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading quiz...</div>;
  }

  if (!quiz || !questions.length) {
    return <div className="text-center py-8">Quiz not found.</div>;
  }

  if (existingAttempt) {
    return null; // Component will unmount as we navigate away
  }

  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>
          <p className="text-muted-foreground mb-6">{quiz.description}</p>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>Duration: {quiz.duration_minutes} minutes</span>
              </div>
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>Questions: {quiz.questions_per_quiz}</span>
              </div>
            </div>

            <Button onClick={startQuiz} className="w-full" size="lg">
              Start Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
          <CircularTimer
            duration={quiz.duration_minutes * 60}
            remaining={timeRemaining}
          />
        </div>

        <div className="space-y-6">
          <div className="text-xl font-medium">
            {currentQuestion.question_text}
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedOption === index
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-secondary"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleNextQuestion}
              disabled={selectedOption === null}
            >
              {currentQuestionIndex === questions.length - 1
                ? "Submit Quiz"
                : "Next Question"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
