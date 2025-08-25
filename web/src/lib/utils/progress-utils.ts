// Utility functions for progress calculations

export function calculateCourseProgress(completedChapters: number, totalChapters: number) {
  if (totalChapters === 0) return { percentage: 0, isComplete: false };
  
  const percentage = (completedChapters / totalChapters) * 100;
  const isComplete = percentage === 100;
  
  return {
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    isComplete,
  };
}

export function getProgressColor(percentage: number) {
  if (percentage === 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-gray-300';
}

export function getProgressText(completedChapters: number, totalChapters: number) {
  if (totalChapters === 0) return 'No chapters available';
  if (completedChapters === 0) return 'Not started';
  if (completedChapters === totalChapters) return 'Completed';
  
  const percentage = Math.round((completedChapters / totalChapters) * 100);
  return `${percentage}% complete`;
}

export function formatProgressStats(completedChapters: number, totalChapters: number) {
  return {
    completed: completedChapters,
    total: totalChapters,
    remaining: totalChapters - completedChapters,
    percentage: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0,
  };
}