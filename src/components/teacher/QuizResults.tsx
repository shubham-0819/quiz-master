import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Archive, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

interface QuizAttempt {
  id: string;
  student: {
    full_name: string;
  };
  started_at: string;
  completed_at: string;
  score: number;
  total_questions: number;
  correct_answers: number;
}

interface QuizDetails {
  title: string;
  description: string;
  is_archived: boolean;
}

export function QuizResults() {
  const { quizId } = useParams();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [sortField, setSortField] = useState<keyof QuizAttempt>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function loadQuizAndAttempts() {
      if (!quizId) return;

      try {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;
        setQuiz(quizData);

        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select(`
            *,
            student:profiles(full_name)
          `)
          .eq('quiz_id', quizId)
          .order('started_at', { ascending: false });

        if (attemptsError) throw attemptsError;
        setAttempts(attemptsData);
      } catch (error: any) {
        toast.error('Failed to load quiz results', {
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    }

    loadQuizAndAttempts();
  }, [quizId]);

  const handleSort = (field: keyof QuizAttempt) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAttempts = [...attempts].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const modifier = sortDirection === 'asc' ? 1 : -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * modifier;
    }
    return ((aValue as number) - (bValue as number)) * modifier;
  });

  const averageScore =
    attempts.length > 0
      ? attempts.reduce((acc, curr) => acc + curr.score, 0) / attempts.length
      : 0;
  const highestScore = attempts.length > 0
    ? Math.max(...attempts.map((a) => a.score))
    : 0;
  const lowestScore = attempts.length > 0
    ? Math.min(...attempts.map((a) => a.score))
    : 0;

  const handleArchiveQuiz = async () => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_archived: true })
        .eq('id', quizId);

      if (error) throw error;
      setQuiz((prev) => prev ? { ...prev, is_archived: true } : null);
      toast.success('Quiz archived successfully');
    } catch (error: any) {
      toast.error('Failed to archive quiz', {
        description: error.message,
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading results...</div>;
  }

  if (!quiz) {
    return <div className="text-center py-8">Quiz not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title} - Results</h1>
          <p className="text-muted-foreground">{quiz.description}</p>
        </div>

        {!quiz.is_archived && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <Archive className="h-4 w-4 mr-2" />
                Archive Quiz
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive Quiz?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will archive the quiz and make it unavailable for new
                  attempts. Existing results will still be accessible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchiveQuiz}>
                  Archive
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-muted-foreground">Average Score</p>
          <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-muted-foreground">Highest Score</p>
          <p className="text-2xl font-bold">{highestScore}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-muted-foreground">Lowest Score</p>
          <p className="text-2xl font-bold">{lowestScore}%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('score')}
                  className="flex items-center"
                >
                  Score
                  <ArrowUpDown className="h-4 w-4 ml-2" />
                </Button>
              </TableHead>
              <TableHead>Correct Answers</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('completed_at')}
                  className="flex items-center"
                >
                  Completed
                  <ArrowUpDown className="h-4 w-4 ml-2" />
                </Button>
              </TableHead>
              <TableHead>Time Taken</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAttempts.map((attempt) => {
              const timeTaken =
                new Date(attempt.completed_at).getTime() -
                new Date(attempt.started_at).getTime();
              const minutes = Math.floor(timeTaken / 60000);
              const seconds = Math.floor((timeTaken % 60000) / 1000);

              return (
                <TableRow key={attempt.id}>
                  <TableCell>{attempt.student.full_name}</TableCell>
                  <TableCell>{attempt.score}%</TableCell>
                  <TableCell>
                    {attempt.correct_answers} / {attempt.total_questions}
                  </TableCell>
                  <TableCell>
                    {format(new Date(attempt.completed_at), 'PPp')}
                  </TableCell>
                  <TableCell>
                    {minutes}:{String(seconds).padStart(2, '0')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}