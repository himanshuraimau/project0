"use client";

import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  UserIcon,
  Loading01Icon,
  MailSend01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
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
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { data: session } = useSession();

  // Load messages from session storage on component mount
  useEffect(() => {
    const storedMessages = sessionStorage.getItem(`rag_chat_${noteId}`);
    const storedInteracted = sessionStorage.getItem(`rag_interacted_${noteId}`);

    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages));
        setHasInteracted(storedInteracted === "true");
      } catch (e) {
        console.error("Failed to parse stored messages:", e);
      }
    } else {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        text: "I’ve read this note. Ask a question and I’ll answer using its content.",
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

  // Save hasInteracted state to session storage
  useEffect(() => {
    sessionStorage.setItem(`rag_interacted_${noteId}`, String(hasInteracted));
  }, [hasInteracted, noteId]);

  // Scroll chat container to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      const chatContainer = messagesEndRef.current.closest(
        ".chat-messages-container",
      );
      if (chatContainer) {
        // Smooth scroll to bottom
        chatContainer.scrollTo({
          top: chatContainer.scrollHeight,
          behavior: "smooth",
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
    setHasInteracted(true);

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
            msg.id === assistantMessageId
              ? { ...msg, text: responseText }
              : msg,
          ),
        );
      }

      // Finalize the message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, streamed: false } : msg,
        ),
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        // Handle aborted request
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, incomplete: true } : msg,
          ),
        );
      } else {
        // Handle other errors
        setError(err.message || "An error occurred");
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId),
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
    toast.success("Chat copied");
  };

  // Handle aborting the stream
  const abortStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col min-h-0 flex-1", className)}>
        <div className="flex-1 overflow-y-auto chat-messages-container min-h-0">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground max-w-[260px]">
                  Ask a question about this note. I’ll answer using its content.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 w-full message-enter",
                      message.role === "user" ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border border-border overflow-hidden",
                        message.role === "user"
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      {message.role === "user" ? (
                        session?.user?.image ? (
                          <img
                            src={session.user.image}
                            alt=""
                            className="size-8 rounded-full object-cover"
                          />
                        ) : (
                          <HugeiconsIcon icon={UserIcon} className="size-4" />
                        )
                      ) : (
                        <img
                          src="/logo.png"
                          alt=""
                          className="size-4 rounded-full object-cover"
                        />
                      )}
                    </div>

                    <div
                      className={cn(
                        "flex flex-col gap-1.5 max-w-[85%]",
                        message.role === "user" ? "items-end" : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-full text-sm",
                          message.role === "user"
                            ? "rounded-xl px-3.5 py-2.5 bg-primary text-primary-foreground"
                            : "border-0 bg-transparent p-0 text-foreground",
                        )}
                      >
                        {message.role === "assistant" ? (
                          message.text ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mb-1.5 prose-headings:mt-0 prose-p:mb-1.5 prose-p:mt-0 prose-li:mb-0.5 prose-headings:text-inherit prose-p:text-inherit prose-strong:text-inherit prose-code:text-inherit prose-li:text-inherit prose-p:text-sm">
                              <MarkdownRenderer content={message.text} />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Thinking…</span>
                          )
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap m-0 text-[13px]">
                            {message.text}
                          </p>
                        )}
                      </div>

                      {message.role === "assistant" && message.text && (
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={() => copyMessage(message.text)}
                              >
                                <HugeiconsIcon
                                  icon={Copy01Icon}
                                  className="size-3.5"
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Copy</p>
                            </TooltipContent>
                          </Tooltip>
                          {message.incomplete && (
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              Interrupted
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 border-t border-border/50 bg-background/50">
          {!hasInteracted && (
            <div className="px-4 pt-3 pb-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Suggestions
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Summarize the key points",
                  "Create practice questions",
                  "Explain difficult concepts",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInputValue(suggestion)}
                    className="rounded-lg cursor-pointer bg-muted/30 px-3 py-2 text-left text-xs text-foreground/60 hover:bg-muted/60 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about this note…"
                disabled={isStreaming}
                className="min-h-10 flex-1 rounded-lg border-border bg-background text-sm focus-visible:ring-ring"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!inputValue.trim() || isStreaming}
                    className="size-10 shrink-0 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isStreaming ? (
                      <HugeiconsIcon
                        icon={Loading01Icon}
                        className="size-4 animate-spin"
                      />
                    ) : (
                      <HugeiconsIcon icon={MailSend01Icon} className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{isStreaming ? "Sending…" : "Send"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
}
