import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface QuizAttempt {
  id: string;
  studentName: string;
  score: number;
  submittedAt: string;
  completed: boolean;
}

const QuizAttempts = () => {
  const { quizId } = useParams();

  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAttempts = async (quizId: string) => {
    try {
      setLoading(true);
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select(
        `*,
         profiles:profiles(id, full_name)
        `
      )
      .eq("quiz_id", quizId)
      .eq("profiles.role", "student")
      .order("completed_at", { ascending: false });

      if (error) throw error;

      const formattedAttempts = data.map((attempt) => ({
        id: attempt.id,
        studentName: attempt.profiles?.full_name,
        score: attempt.score,
        submittedAt: attempt.completed_at,
        completed: attempt.completed,
      }));

      setAttempts(formattedAttempts);
      setLoading(false);
    } catch (error) {
      console.error("Error loading attempts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(quizId);

    if (!quizId) return;
    loadAttempts(quizId);
  }, [quizId]);

  if (loading) return <div>Loading attempts...</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Quiz Attempts</h2>
      {attempts.length === 0 ? (
        <p>No attempts found for this quiz.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Student</th>
              <th className="p-2 text-left">Score</th>
              <th className="p-2 text-left">Submitted</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt.id} className="border-b">
                <td className="p-2">{attempt.studentName}</td>
                <td className="p-2">{attempt.score}</td>
                <td className="p-2">
                  {new Date(attempt.submittedAt).toLocaleString()}
                </td>
                <td className="p-2">
                  {attempt.completed ? "Completed" : "In Progress"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default QuizAttempts;
