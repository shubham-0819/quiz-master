import { cn } from '@/lib/utils';

interface CircularTimerProps {
  duration: number;
  remaining: number;
  className?: string;
}

export function CircularTimer({ duration, remaining, className }: CircularTimerProps) {
  const percentage = (remaining / duration) * 100;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className={cn('relative w-16 h-16', className)}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-muted"
        />
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray={175.93}
          strokeDashoffset={175.93 - (percentage / 100) * 175.93}
          className={cn(
            'text-primary transition-all duration-200',
            percentage <= 25 && 'text-destructive'
          )}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
}