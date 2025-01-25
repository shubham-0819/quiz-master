/*
  # Quiz Platform Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (text, either 'teacher' or 'student')
      - `full_name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `questions`
      - `id` (uuid, primary key)
      - `created_by` (uuid, references profiles)
      - `question_text` (text)
      - `options` (jsonb array of options)
      - `correct_answer` (integer, 0-3 index)
      - `difficulty` (text)
      - `topic` (text)
      - `hint` (text)
      - `explanation` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `quizzes`
      - `id` (uuid, primary key)
      - `created_by` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `duration_minutes` (integer)
      - `questions_per_quiz` (integer)
      - `question_timer_seconds` (integer)
      - `points_per_question` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `quiz_questions`
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, references quizzes)
      - `question_id` (uuid, references questions)
      - `order` (integer)
    
    - `quiz_attempts`
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, references quizzes)
      - `student_id` (uuid, references profiles)
      - `started_at` (timestamp)
      - `completed_at` (timestamp)
      - `score` (integer)
      - `total_questions` (integer)
      - `correct_answers` (integer)
    
    - `question_responses`
      - `id` (uuid, primary key)
      - `attempt_id` (uuid, references quiz_attempts)
      - `question_id` (uuid, references questions)
      - `selected_option` (integer)
      - `is_correct` (boolean)
      - `time_taken_seconds` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for teachers and students
    - Secure access to quiz data
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('teacher', 'student');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Profiles table
CREATE TABLE profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    role user_role NOT NULL,
    full_name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Questions table
CREATE TABLE questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by uuid REFERENCES profiles NOT NULL,
    question_text text NOT NULL,
    options jsonb NOT NULL,
    correct_answer integer NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
    difficulty difficulty_level NOT NULL,
    topic text NOT NULL,
    hint text,
    explanation text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Quizzes table
CREATE TABLE quizzes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by uuid REFERENCES profiles NOT NULL,
    title text NOT NULL,
    description text,
    duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
    questions_per_quiz integer NOT NULL CHECK (questions_per_quiz > 0),
    question_timer_seconds integer CHECK (question_timer_seconds > 0),
    points_per_question integer NOT NULL DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Quiz Questions junction table
CREATE TABLE quiz_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id uuid REFERENCES quizzes NOT NULL,
    question_id uuid REFERENCES questions NOT NULL,
    "order" integer NOT NULL,
    UNIQUE(quiz_id, question_id),
    UNIQUE(quiz_id, "order")
);

-- Quiz Attempts table
CREATE TABLE quiz_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id uuid REFERENCES quizzes NOT NULL,
    student_id uuid REFERENCES profiles NOT NULL,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    score integer DEFAULT 0,
    total_questions integer NOT NULL,
    correct_answers integer DEFAULT 0,
    UNIQUE(quiz_id, student_id)
);

-- Question Responses table
CREATE TABLE question_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid REFERENCES quiz_attempts NOT NULL,
    question_id uuid REFERENCES questions NOT NULL,
    selected_option integer CHECK (selected_option >= 0 AND selected_option <= 3),
    is_correct boolean NOT NULL,
    time_taken_seconds integer NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can read their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Questions Policies
CREATE POLICY "Teachers can create questions"
    ON questions FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'teacher'
    ));

CREATE POLICY "Teachers can update their own questions"
    ON questions FOR UPDATE
    TO authenticated
    USING (
        created_by IN (
            SELECT id FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'teacher'
        )
    );

CREATE POLICY "Everyone can read questions"
    ON questions FOR SELECT
    TO authenticated
    USING (true);

-- Quizzes Policies
CREATE POLICY "Teachers can create quizzes"
    ON quizzes FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'teacher'
    ));

CREATE POLICY "Teachers can update their own quizzes"
    ON quizzes FOR UPDATE
    TO authenticated
    USING (
        created_by IN (
            SELECT id FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'teacher'
        )
    );

CREATE POLICY "Everyone can read quizzes"
    ON quizzes FOR SELECT
    TO authenticated
    USING (true);

-- Quiz Questions Policies
CREATE POLICY "Teachers can manage quiz questions"
    ON quiz_questions FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'teacher'
    ));

CREATE POLICY "Everyone can read quiz questions"
    ON quiz_questions FOR SELECT
    TO authenticated
    USING (true);

-- Quiz Attempts Policies
CREATE POLICY "Students can create and read their own attempts"
    ON quiz_attempts FOR ALL
    TO authenticated
    USING (
        student_id IN (
            SELECT id FROM profiles
            WHERE profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can read all attempts"
    ON quiz_attempts FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'teacher'
    ));

-- Question Responses Policies
CREATE POLICY "Students can manage their own responses"
    ON question_responses FOR ALL
    TO authenticated
    USING (
        attempt_id IN (
            SELECT id FROM quiz_attempts
            WHERE student_id IN (
                SELECT id FROM profiles
                WHERE profiles.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Teachers can read all responses"
    ON question_responses FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'teacher'
    ));

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();