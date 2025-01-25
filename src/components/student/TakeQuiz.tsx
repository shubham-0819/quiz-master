import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export function TakeQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);

  useEffect(() => {
    async function loadQuiz() {
      if (!quizId) return;

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (error) {
        navigate('/dashboard');
        return;
      }

      setQuiz(data);
      setLoading(false);
    }

    loadQuiz();
  }, [quizId, navigate]);

  if (loading) {
    return <div className="text-center py-8">Loading quiz...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>
        <p className="text-muted-foreground mb-6">{quiz.description}</p>
        
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Duration: {quiz.duration_minutes} minutes</span>
            <span>Questions: {quiz.questions_per_quiz}</span>
          </div>
          
          <Button className="w-full" size="lg">
            Start Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}