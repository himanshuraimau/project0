"use client";

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Copy, Loader2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

type MessageRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  streamed?: boolean;
  incomplete?: boolean;
}

interface ChapterChatbotProps {
  chapterId: string;
  chapterName: string;
}

export function ChapterChatbot({ chapterId, chapterName }: ChapterChatbotProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load messages from session storage on component mount
  useEffect(() => {
    const storedMessages = sessionStorage.getItem(`chapter_chat_${chapterId}`);
    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages));
      } catch (e) {
        console.error('Failed to parse stored messages:', e);
      }
    } else {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        text: `Hi! I'm your AI assistant for "${chapterName}". I can help you understand the concepts, answer questions about the content, and clarify any doubts you might have. What would you like to know?`,
      };
      setMessages([welcomeMessage]);
    }
  }, [chapterId, chapterName]);

  // Save messages to session storage when they change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(`chapter_chat_${chapterId}`, JSON.stringify(messages));
    }
  }, [messages, chapterId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isStreaming) return;
    
    // Add user message
    const userMessageId = uuidv4();
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: inputValue,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setError(null);
    
    // Create empty assistant message for streaming
    const assistantMessageId = uuidv4();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      text: '',
      streamed: true,
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsStreaming(true);
    
    try {
      // Create an abort controller for the fetch request
      abortControllerRef.current = new AbortController();
      
      // Send the request to the API
      const response = await fetch(`/api/chapter/${chapterId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          chapterId,
          topK: 6,
        }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }
      
      // Get a reader for the response stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }
      
      // Read the stream
      let accumulatedText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the received chunk
        const chunk = new TextDecoder().decode(value);
        accumulatedText += chunk;
        
        // Update the assistant message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, text: accumulatedText } 
              : msg
          )
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Handle aborted request
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, incomplete: true } 
              : msg
          )
        );
      } else {
        // Handle other errors
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        setMessages(prev => 
          prev.filter(msg => msg.id !== assistantMessageId)
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };
  
  // Handle message copying
  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  // Handle aborting the stream
  const abortStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-background border rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b bg-muted/30 rounded-t-lg">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-base">Chapter Assistant</h3>
          <p className="text-sm text-muted-foreground">{chapterName}</p>
        </div>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Bot className="h-12 w-12 text-primary/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">How can I help you?</h3>
            <p className="text-muted-foreground">
              Ask me about this chapter and I&apos;ll try to answer your questions.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-4",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-primary" />
                </div>
              )}
              <div className="space-y-2 max-w-[75%]">
                <Card className={cn(
                  "rounded-2xl px-4 py-3",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted border-0"
                )}>
                  <div className="space-y-2">
                    <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>
                    {message.role === 'assistant' && message.text && (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 hover:bg-primary/5 text-xs"
                          onClick={() => copyMessage(message.text)}
                        >
                          <Copy size={12} className="mr-1" />
                          Copy
                        </Button>
                      </div>
                    )}
                    {message.incomplete && (
                      <div className="text-xs italic text-muted-foreground">
                        Message was cut off
                      </div>
                    )}
                  </div>
                </Card>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-primary-foreground" />
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Error message */}
        {error && (
          <div className="flex justify-center">
            <Card className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-4">
              {error}
            </Card>
          </div>
        )}
        
        {/* Dummy div for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-6 border-t bg-muted/10 rounded-b-lg flex gap-3">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            // Stop propagation for all key events when input is focused
            e.stopPropagation();
          }}
          placeholder="Ask a question about this chapter..."
          disabled={isStreaming}
          className="flex-1 rounded-2xl border-2 border-muted py-3 px-4 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0"
        />
        
        {isStreaming ? (
          <Button 
            type="button" 
            variant="destructive" 
            onClick={abortStream}
            className="rounded-full px-4 py-3"
          >
            <Loader2 className="animate-spin" size={18} />
          </Button>
        ) : (
          <Button 
            type="submit" 
            disabled={!inputValue.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 py-3"
          >
            <Send size={18} />
          </Button>
        )}
      </form>
    </div>
  );
}