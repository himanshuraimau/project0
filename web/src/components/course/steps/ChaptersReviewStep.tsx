"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChaptersReviewStepProps } from "@/lib/types/course.types";
import { Edit3, Check, X, BookOpen, PlayCircle, Trash2 } from "lucide-react";
import { LoadingState, InlineLoading } from "@/components/ui/loading-spinner";
import {
  validateUnitName,
  validateChapterName,
  sanitizeString,
  validateContentSafety,
} from "@/lib/utils/validation";

/**
 * ChaptersReviewStep component displays the complete hierarchical course structure
 * Allows final editing of unit and chapter names before saving the course
 */
export function ChaptersReviewStep({
  courseTitle,
  units,
  onSave,
  onEdit,
  onDeleteChapter,
  isLoading,
}: ChaptersReviewStepProps) {
  const [editingItem, setEditingItem] = useState<{
    unitId: string;
    chapterId?: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Start editing a unit or chapter
  const startEditing = (unitId: string, chapterId?: string) => {
    const unit = units.find((u) => u.id === unitId);
    if (!unit) return;

    if (chapterId) {
      const chapter = unit.chapters.find((c) => c.id === chapterId);
      if (chapter) {
        setEditingItem({ unitId, chapterId });
        setEditValue(chapter.name);
      }
    } else {
      setEditingItem({ unitId });
      setEditValue(unit.name);
    }
    setError("");
  };

  // Save edited item
  const saveEdit = () => {
    if (!editingItem) return;

    // Determine if editing unit or chapter and validate accordingly
    const isEditingChapter = !!editingItem.chapterId;
    const validation = isEditingChapter
      ? validateChapterName(editValue)
      : validateUnitName(editValue);

    if (!validation.isValid) {
      setError(validation.error || "Invalid name");
      return;
    }

    // Content safety validation
    const safetyCheck = validateContentSafety(editValue);
    if (!safetyCheck.isSafe) {
      setError(`Content validation failed: ${safetyCheck.reason}`);
      return;
    }

    // Sanitize the input
    let sanitizedValue;
    try {
      sanitizedValue = sanitizeString(editValue);
    } catch (sanitizeError) {
      setError("Invalid characters in name");
      return;
    }

    if (editingItem) {
      onEdit(editingItem.unitId, editingItem.chapterId || "", editValue.trim());
    }

    setEditingItem(null);
    setEditValue("");
    setError("");
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingItem(null);
    setEditValue("");
    setError("");
  };

  // Handle key press in edit input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  // Delete a chapter
  const deleteChapter = (unitId: string, chapterId: string) => {
    const unit = units.find((u) => u.id === unitId);

    // Don't allow deleting the last chapter in a unit
    if (unit && unit.chapters.length <= 1) {
      setError(
        "Cannot delete the last chapter in a unit. Each unit must have at least one chapter."
      );
      return;
    }

    // Clear editing state if we're editing the chapter being deleted
    if (
      editingItem?.unitId === unitId &&
      editingItem?.chapterId === chapterId
    ) {
      setEditingItem(null);
      setEditValue("");
      setError("");
    }

    onDeleteChapter(unitId, chapterId);
  };

  // Generate chapter number (e.g., 1.1, 1.2, 2.1, 2.2)
  const getChapterNumber = (unitIndex: number, chapterIndex: number) => {
    return `${unitIndex + 1}.${chapterIndex + 1}`;
  };

  // Check if currently editing this item
  const isEditing = (unitId: string, chapterId?: string) => {
    return (
      editingItem?.unitId === unitId && editingItem?.chapterId === chapterId
    );
  };

  const totalChapters = units.reduce(
    (total, unit) => total + unit.chapters.length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Review Course Structure
        </h2>
        <p className="text-muted-foreground">
          Your complete course structure is ready. Make any final edits before
          saving.
        </p>
      </div>

      <div className="max-w-4xl mx-auto border-border/60 bg-card/80 rounded-3xl">
        <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 border-b border-border/40 rounded-3xl pt-5">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{courseTitle}</h3>
              <p className="text-sm text-muted-foreground font-normal">
                {units.length} units • {totalChapters} chapters
              </p>
            </div>
          </CardTitle>
        </CardHeader>
      </div>

      {/* Hierarchical Course Structure */}
      <div className="max-w-4xl mx-auto space-y-4">
        {units.map((unit, unitIndex) => (
          <Card key={unit.id} className="overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm rounded-3xl">
            <CardHeader className="bg-muted/20 border-b border-border/30 pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-accent/90 text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                    {unitIndex + 1}
                  </div>
                  <div className="flex-1">
                    {isEditing(unit.id) ? (
                      <div className="space-y-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="Enter unit name..."
                          className={`text-lg font-semibold ${
                            error ? "border-destructive" : ""
                          }`}
                          autoFocus
                        />
                        {error && (
                          <p className="text-sm text-destructive">{error}</p>
                        )}
                      </div>
                    ) : (
                      <h4 className="text-lg font-semibold text-foreground">
                        Unit {unitIndex + 1}: {unit.name}
                      </h4>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isEditing(unit.id) ? (
                    <>
                      <Button
                        onClick={saveEdit}
                        variant="ghost"
                        size="sm"
                        className="text-accent hover:text-accent/80 hover:bg-accent/10"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={cancelEdit}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => startEditing(unit.id)}
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                      className="text-accent hover:text-accent/80 hover:bg-accent/10"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-border/20">
                {unit.chapters.map((chapter, chapterIndex) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0 w-12 h-8 bg-muted/50 text-foreground rounded-md flex items-center justify-center text-sm font-medium border border-border/30">
                        {getChapterNumber(unitIndex, chapterIndex)}
                      </div>

                      <div className="flex-1">
                        {isEditing(unit.id, chapter.id) ? (
                          <div className="space-y-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleKeyPress}
                              placeholder="Enter chapter name..."
                              className={error ? "border-destructive" : ""}
                              autoFocus
                            />
                            {error && (
                              <p className="text-sm text-destructive">{error}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <h5 className="font-medium text-foreground">
                              {chapter.name}
                            </h5>
                            <div className="flex items-center space-x-2 mt-1">
                              <PlayCircle className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Search: {chapter.youtubeSearchQuery}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isEditing(unit.id, chapter.id) ? (
                        <>
                          <Button
                            onClick={saveEdit}
                            variant="ghost"
                            size="sm"
                            className="text-accent hover:text-accent/80 hover:bg-accent/10"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={cancelEdit}
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => startEditing(unit.id, chapter.id)}
                            variant="ghost"
                            size="sm"
                            disabled={isLoading}
                            className="text-accent hover:text-accent/80 hover:bg-accent/10"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => deleteChapter(unit.id, chapter.id)}
                            variant="ghost"
                            size="sm"
                            disabled={isLoading || unit.chapters.length <= 1}
                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 disabled:text-muted-foreground disabled:hover:bg-transparent"
                            title={
                              unit.chapters.length <= 1
                                ? "Cannot delete the last chapter in a unit"
                                : "Delete chapter"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading Overlay for Saving */}
      {isLoading && (
        <div className="max-w-4xl mx-auto mb-6">
          <LoadingState
            message="Saving Your Course"
            submessage="Creating course structure in the database..."
            variant="save"
            className="bg-accent/5 border border-accent/10 rounded-lg"
          />
        </div>
      )}

      {/* Save Button */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-accent/5 to-accent/10 border border-accent/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-accent mb-2">
                Ready to Create Your Course?
              </h3>
              <p className="text-muted-foreground">
                Your course structure looks great! Click below to save and start
                building your content.
              </p>
            </div>

            <Button
              onClick={onSave}
              disabled={isLoading || editingItem !== null}
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <InlineLoading
                  message="Saving Course..."
                  variant="save"
                  className="text-white"
                />
              ) : (
                "Let's Go!"
              )}
            </Button>

            {editingItem && (
              <p className="text-sm text-muted-foreground">
                Please finish editing before saving the course.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
