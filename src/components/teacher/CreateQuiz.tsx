import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function CreateQuiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const duration = parseInt(formData.get('duration') as string);
    const questionsCount = parseInt(formData.get('questionsCount') as string);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data: quiz, error } = await supabase
        .from('quizzes')
        .insert({
          title,
          description,
          duration_minutes: duration,
          questions_per_quiz: questionsCount,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Quiz created successfully');
      navigate(`/quiz/${quiz.id}/questions`);
    } catch (error: any) {
      toast.error('Failed to create quiz', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Quiz</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Quiz Title</Label>
            <Input
              id="title"
              name="title"
              required
              className="mt-1"
              placeholder="Enter quiz title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              required
              className="mt-1"
              placeholder="Enter quiz description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="1"
                required
                className="mt-1"
                placeholder="Enter duration"
              />
            </div>

            <div>
              <Label htmlFor="questionsCount">Number of Questions</Label>
              <Input
                id="questionsCount"
                name="questionsCount"
                type="number"
                min="1"
                required
                className="mt-1"
                placeholder="Enter number of questions"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Quiz...' : 'Create Quiz'}
          </Button>
        </form>
      </div>
    </div>
  );
}