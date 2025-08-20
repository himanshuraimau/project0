"use client";
import { cn } from "@/lib/utils";
import { Chapter, Question } from "@prisma/client";
import React from "react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { ChevronRight } from "lucide-react";

type Props = {
  chapter: Chapter & {
    questions: Question[];
  };
};

const QuizCards = ({ chapter }: Props) => {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [questionState, setQuestionState] = React.useState<
    Record<string, boolean | null>
  >({});
  const checkAnswer = React.useCallback(() => {
    const newQuestionState = { ...questionState };
    chapter.questions.forEach((question) => {
      const user_answer = answers[question.id];
      if (!user_answer) return;
      if (user_answer === question.answer) {
        newQuestionState[question.id] = true;
      } else {
        newQuestionState[question.id] = false;
      }
      setQuestionState(newQuestionState);
    });
  }, [answers, questionState, chapter.questions]);
  return (
    <div className="flex-[1] ml-8">
      <h1 className="text-xl font-bold mb-4 text-foreground">Concept Check</h1>
      <div className="space-y-4">
        {chapter.questions.map((question) => {
          const options = JSON.parse(question.options) as string[];
          const state = questionState[question.id];
          return (
            <div
              key={question.id}
              className={cn(
                "p-4 rounded-xl border shadow transition-all duration-200",
                state === true
                  ? "bg-green-50 border-green-400 dark:bg-green-900/30 dark:border-green-600"
                  : state === false
                  ? "bg-red-50 border-red-400 dark:bg-red-900/30 dark:border-red-600"
                  : "bg-card border-border dark:bg-muted dark:border-border"
              )}
            >
              <h2 className="text-base font-semibold mb-2 text-foreground flex items-center gap-2">
                {question.question}
                {state === true && <span className="text-green-600">✔️</span>}
                {state === false && <span className="text-red-600">❌</span>}
              </h2>
              <RadioGroup
                onValueChange={(e) => {
                  setAnswers((prev) => ({ ...prev, [question.id]: e }));
                }}
                className="space-y-2"
              >
                {options.map((option, index) => (
                  <div className="flex items-center gap-2" key={index}>
                    <RadioGroupItem
                      value={option}
                      id={question.id + index.toString()}
                    />
                    <Label htmlFor={question.id + index.toString()} className="text-sm">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          );
        })}
      </div>
      <Button
        className="w-full mt-6 text-base font-semibold py-3 rounded-xl shadow"
        size="lg"
        onClick={checkAnswer}
      >
        Check Answers
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

export default QuizCards;