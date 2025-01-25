import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  Clock,
  BarChart,
  ArrowLeft,
} from 'lucide-react';

interface QuizAttempt {
  id: string;
  quiz: {
    title: string;
  };
  started_at: string;
  completed_at: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  question_responses: Array<{
    question_id: string;
    selected_option: number;
    is_correct: boolean;
    time_taken_seconds: number;
  }>;
}

export function QuizResults() {
  const { quizId } = useParams();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    async function loadResults() {
      if (!quizId) return;

      try {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select(`
            *,
            quiz:quizzes(title),
            question_responses(*)
          `)
          .eq('quiz_id', quizId)
          .order('started_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        setAttempt(data);
      } catch (error: any) {
        console.error('Failed to load results:', error);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [quizId]);

  if (loading) {
    return <div className="text-center py-8">Loading results...</div>;
  }

  if (!attempt) {
    return <div className="text-center py-8">No results found.</div>;
  }

  const timeTaken = new Date(attempt.completed_at).getTime() - new Date(attempt.started_at).getTime();
  const minutes = Math.floor(timeTaken / 60000);
  const seconds = Math.floor((timeTaken % 60000) / 1000);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{attempt.quiz.title} - Results</h1>
        <Link to="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <BarChart className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">{attempt.score}%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Final Score</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold">{attempt.correct_answers}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Correct Answers</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-2xl font-bold">
              {attempt.total_questions - attempt.correct_answers}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Incorrect Answers</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <Clock className="h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold">
              {minutes}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Time Taken</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Attempt Details</h2>
        <dl className="space-y-4">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Started</dt>
            <dd>{format(new Date(attempt.started_at), 'PPp')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Completed</dt>
            <dd>{format(new Date(attempt.completed_at), 'PPp')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Questions Attempted</dt>
            <dd>{attempt.total_questions}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Average Time per Question</dt>
            <dd>
              {Math.round(
                attempt.question_responses.reduce(
                  (acc, curr) => acc + curr.time_taken_seconds,
                  0
                ) / attempt.total_questions
              )}{' '}
              seconds
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}