/*
  # Fix Quiz Attempts Timestamps

  1. Changes
    - Add started_at and updated_at timestamps to quiz_attempts table
    - Add trigger for updating updated_at timestamp
*/

-- Add timestamps to quiz_attempts if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_attempts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE quiz_attempts ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create trigger for updating timestamps
CREATE TRIGGER update_quiz_attempts_updated_at
    BEFORE UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();