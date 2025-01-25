import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function QuizResults() {
  const { quizId } = useParams();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    async function loadResults() {
      if (!quizId) return;

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes(title),
          question_responses(*)
        `)
        .eq('quiz_id', quizId)
        .single();

      if (!error && data) {
        setResults(data);
      }
      setLoading(false);
    }

    loadResults();
  }, [quizId]);

  if (loading) {
    return <div className="text-center py-8">Loading results...</div>;
  }

  if (!results) {
    return <div className="text-center py-8">No results found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold mb-4">{results.quiz.title} - Results</h1>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-2xl font-bold">{results.score}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Correct Answers</p>
              <p className="text-2xl font-bold">
                {results.correct_answers} / {results.total_questions}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}