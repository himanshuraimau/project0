'use client';

import React from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PodcastAskInputProps {
  onSubmit: (question: string) => void;
  disabled?: boolean;
}

export function PodcastAskInput({ onSubmit, disabled = false }: PodcastAskInputProps) {
  const [question, setQuestion] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !disabled) {
      onSubmit(question.trim());
      setQuestion('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center gap-2">
        <div className="absolute left-3 text-purple-500">
          <Sparkles className="h-4 w-4" />
        </div>
        <Input
          type="text"
          placeholder="Ask about this podcast..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={disabled}
          className="pl-10 pr-12 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!question.trim() || disabled}
          className="absolute right-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg h-8 w-8"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
