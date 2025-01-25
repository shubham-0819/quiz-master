import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  hint?: string;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  questions_per_quiz: number;
}

export function QuizQuestions() {
  const { quizId } = useParams();

  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    difficulty: 'medium' as const,
    topic: '',
    hint: '',
    explanation: '',
  });

  useEffect(() => {
    async function loadQuizAndQuestions() {
      if (!quizId) return;

      try {
        // Load quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;
        setQuiz(quizData);

        // Load existing questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizId)

        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);
      } catch (error: any) {
        toast.error('Failed to load quiz', {
          description: error.message,
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadQuizAndQuestions();
  }, [quizId, navigate]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .single();

      if (!profile) throw new Error('Profile not found');

      // Save the question
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          ...currentQuestion,
          created_by: profile.id,
          quiz_id: quizId,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Update questions list
      setQuestions([...questions, question]);

      // Reset form
      setCurrentQuestion({
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        difficulty: 'medium',
        topic: '',
        hint: '',
        explanation: '',
      });

      toast.success('Question added successfully');
    } catch (error: any) {
      toast.error('Failed to add question', {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading quiz details...</div>;
  }

  if (!quiz) {
    return <div className="text-center py-8">Quiz not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
        <p className="text-muted-foreground mb-4">
          {questions.length} of {quiz.questions_per_quiz} questions added
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="question">Question Text</Label>
            <Textarea
              id="question"
              value={currentQuestion.question_text}
              onChange={(e) =>
                setCurrentQuestion({
                  ...currentQuestion,
                  question_text: e.target.value,
                })
              }
              required
              className="mt-1"
              placeholder="Enter your question"
            />
          </div>

          <div className="space-y-4">
            <Label>Answer Options</Label>
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required
                  placeholder={`Option ${index + 1}`}
                />
                <Button
                  type="button"
                  variant={currentQuestion.correct_answer === index ? 'default' : 'outline'}
                  onClick={() =>
                    setCurrentQuestion({ ...currentQuestion, correct_answer: index })
                  }
                >
                  Correct
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={currentQuestion.difficulty}
                onValueChange={(value: 'easy' | 'medium' | 'hard') =>
                  setCurrentQuestion({ ...currentQuestion, difficulty: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={currentQuestion.topic}
                onChange={(e) =>
                  setCurrentQuestion({ ...currentQuestion, topic: e.target.value })
                }
                required
                placeholder="Enter topic"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="hint">Hint (Optional)</Label>
            <Input
              id="hint"
              value={currentQuestion.hint}
              onChange={(e) =>
                setCurrentQuestion({ ...currentQuestion, hint: e.target.value })
              }
              placeholder="Enter a hint"
            />
          </div>

          <div>
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={currentQuestion.explanation}
              onChange={(e) =>
                setCurrentQuestion({
                  ...currentQuestion,
                  explanation: e.target.value,
                })
              }
              placeholder="Explain the correct answer"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={saving || questions.length >= quiz.questions_per_quiz}
          >
            {saving
              ? 'Adding Question...'
              : questions.length >= quiz.questions_per_quiz
              ? 'Maximum Questions Reached'
              : 'Add Question'}
          </Button>
        </form>
      </div>

      {questions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Added Questions</h2>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Question {index + 1}
                    </span>
                    <p className="font-medium mt-1">{question.question_text}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100">
                    {question.difficulty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}