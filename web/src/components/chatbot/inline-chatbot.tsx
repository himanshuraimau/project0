"use client";

import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, Copy, Loader2, Bot, User, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/mdx-renderer";

type MessageRole = "user" | "assistant" | "system";

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

export default function InlineChatbot({
  noteId,
  className,
}: InlineChatbotProps) {
  const [inputValue, setInputValue] = useState("");
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
        console.error("Failed to parse stored messages:", e);
      }
    } else {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
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
      const chatContainer = messagesEndRef.current.closest(
        ".chat-messages-container"
      );
      if (chatContainer) {
        // Smooth scroll to bottom
        chatContainer.scrollTo({
          top: chatContainer.scrollHeight,
          behavior: 'smooth'
        });
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
      role: "user",
      text: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setError(null);

    // Create empty assistant message for streaming
    const assistantMessageId = uuidv4();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      text: "",
      streamed: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsStreaming(true);

    try {
      // Create an abort controller for the fetch request
      abortControllerRef.current = new AbortController();

      // Make API request
      const response = await fetch(`/api/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.text,
          noteId: noteId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read response");
      }

      // Process the stream
      let responseText = "";
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
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, text: responseText } : msg
          )
        );
      }

      // Finalize the message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, streamed: false } : msg
        )
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        // Handle aborted request
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, incomplete: true } : msg
          )
        );
      } else {
        // Handle other errors
        setError(err.message || "An error occurred");
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId)
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
    <TooltipProvider>
      <div className={cn("flex flex-col h-full bg-card", className)}>
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto p-4 chat-messages-container">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-card-foreground">
                  How can I help you?
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Ask me about this note and I'll try to answer your questions using the content.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 w-full message-enter",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback 
                      className={cn(
                        message.role === "user" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4 text-white dark:text-black" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message Content */}
                  <div className={cn(
                    "flex flex-col space-y-2 max-w-[80%]",
                    message.role === "user" ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "rounded-2xl px-4 py-3 max-w-full break-words",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}>
                      {message.role === "assistant" ? (
                        message.text ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-headings:mt-0 prose-p:mb-2 prose-p:mt-0 prose-li:mb-1 prose-headings:text-inherit prose-p:text-inherit prose-strong:text-inherit prose-code:text-inherit prose-li:text-inherit">
                            <MarkdownRenderer content={message.text} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm">
                            <Loader2 className="animate-spin h-4 w-4" />
                            <span>Thinking...</span>
                          </div>
                        )
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap m-0 text-white dark:text-black">
                          {message.text}
                        </p>
                      )}
                    </div>

                    {/* Message Actions */}
                    <div className="flex items-center gap-1">
                      {message.role === "assistant" && message.text && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => copyMessage(message.text)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy message</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      {message.incomplete && (
                        <Badge variant="outline" className="text-xs">
                          Interrupted
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 flex justify-center">
              <div className="bg-destructive/10 text-destructive rounded-2xl px-4 py-3 text-sm max-w-md">
                <div className="flex items-center gap-2">
                  <div className="font-medium">Error</div>
                  <Separator orientation="vertical" className="h-4" />
                  <div>{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="border-t ">
          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask a question about this note..."
                  disabled={isStreaming}
                  className="resize-none"
                />
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!inputValue.trim() || isStreaming}
                    className={cn(
                      "shrink-0",
                      !inputValue.trim() && "opacity-50"
                    )}
                  >
                    {isStreaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 text-white dark:text-black" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isStreaming ? "Generating..." : "Send message"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
}
