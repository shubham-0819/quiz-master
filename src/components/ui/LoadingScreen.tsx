import { GraduationCap } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <GraduationCap className="h-12 w-12 text-indigo-600 animate-bounce" />
      <h2 className="mt-4 text-xl font-semibold text-gray-900">Loading...</h2>
    </div>
  );
}