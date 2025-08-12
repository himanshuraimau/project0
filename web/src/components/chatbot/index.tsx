"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { MessageCircle, Bot } from 'lucide-react';

// Lazy load the chatbot component
const DynamicChatbot = dynamic(
  () => import('../chatbot/chatbot'),
  { ssr: false }
);

interface ChatWithNoteButtonProps {
  noteId: string;
  className?: string;
}

export function ChatWithNoteButton({ noteId, className }: ChatWithNoteButtonProps) {
  const [showChat, setShowChat] = useState(false);
  
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowChat(true)}
        className="flex items-center gap-4 border-2 border-primary hover:bg-primary/5 text-primary rounded-2xl px-6 py-3 transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        <div className="p-1 bg-primary/10 rounded-full">
          <Bot size={18} className="text-primary" />
        </div>
        <span>Chat with Note</span>
      </Button>
      
      {showChat && (
        <DynamicChatbot
          noteId={noteId}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
}

export { default } from './chatbot';
export { ChatbotSection } from './chatbot-section';
