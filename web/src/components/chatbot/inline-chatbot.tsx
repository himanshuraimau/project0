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

interface InlineChatbotProps {
  noteId: string;
  className?: string;
}

export default function InlineChatbot({ noteId, className }: InlineChatbotProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load messages from session storage on component mount
  useEffect(() => {
    const storedMessages = sessionStorage.getItem(`rag_chat_${noteId}`);
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
        text: "Hello! I can answer questions about this note. What would you like to know?",
      };
      setMessages([welcomeMessage]);
    }
  }, [noteId]);

  // Save messages to session storage when they change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(`rag_chat_${noteId}`, JSON.stringify(messages));
    }
  }, [messages, noteId]);

  // Scroll chat container to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      const chatContainer = messagesEndRef.current.closest('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
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
      
      // Make API request
      const response = await fetch(`/api/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          noteId: noteId
        }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response');
      }
      
      // Process the stream
      let responseText = '';
      let decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the chunk and append to the response text
        const chunk = decoder.decode(value, { stream: true });
        responseText += chunk;
        
        // Update the assistant message with the current text
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, text: responseText } 
              : msg
          )
        );
      }
      
      // Finalize the message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, streamed: false } 
            : msg
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
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
        setError(err.message || 'An error occurred');
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
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 h-[calc(100%-72px)] chat-messages-container">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Bot className="h-10 w-10 text-primary/50 mb-3" />
            <h3 className="text-base font-semibold mb-1">How can I help you?</h3>
            <p className="text-muted-foreground text-sm">
              Ask me about this note and I'll try to answer your questions.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-primary" />
                </div>
              )}
              <div className="space-y-1">
                <Card className={cn(
                  "rounded-2xl px-3 py-2 max-w-[85%]",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted border-0"
                )}>
                  <div className="space-y-1">
                    <div className="text-sm">{message.text}</div>
                    {message.role === 'assistant' && message.text && (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 hover:bg-primary/5 text-xs"
                          onClick={() => copyMessage(message.text)}
                        >
                          <Copy size={10} className="mr-1" />
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
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-primary-foreground" />
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Error message */}
        {error && (
          <div className="flex justify-center">
            <Card className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-3 text-sm">
              {error}
            </Card>
          </div>
        )}
        
        {/* Dummy div for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            // Stop propagation for all key events when input is focused
            e.stopPropagation();
          }}
          placeholder="Ask a question..."
          disabled={isStreaming}
          className="flex-1 rounded-2xl border-2 border-muted py-4 text-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0"
        />
        
        <Button 
          type="submit" 
          disabled={!inputValue.trim() || isStreaming}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-2 aspect-square"
        >
          {isStreaming ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
        </Button>
      </form>
    </div>
  );
}
