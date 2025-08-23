'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChaptersReviewStepProps } from '@/lib/types/course.types';
import { Edit3, Check, X, BookOpen, PlayCircle } from 'lucide-react';
import { LoadingState, InlineLoading } from '@/components/ui/loading-spinner';
import { validateUnitName, validateChapterName, sanitizeString, validateContentSafety } from '@/lib/utils/validation';

/**
 * ChaptersReviewStep component displays the complete hierarchical course structure
 * Allows final editing of unit and chapter names before saving the course
 */
export function ChaptersReviewStep({ 
  courseTitle,
  units, 
  onSave, 
  onEdit, 
  isLoading 
}: ChaptersReviewStepProps) {
  const [editingItem, setEditingItem] = useState<{ unitId: string; chapterId?: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Start editing a unit or chapter
  const startEditing = (unitId: string, chapterId?: string) => {
    const unit = units.find(u => u.id === unitId);
    if (!unit) return;

    if (chapterId) {
      const chapter = unit.chapters.find(c => c.id === chapterId);
      if (chapter) {
        setEditingItem({ unitId, chapterId });
        setEditValue(chapter.name);
      }
    } else {
      setEditingItem({ unitId });
      setEditValue(unit.name);
    }
    setError('');
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
      setError(validation.error || 'Invalid name');
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
      setError('Invalid characters in name');
      return;
    }

    if (editingItem) {
      onEdit(editingItem.unitId, editingItem.chapterId || '', editValue.trim());
    }
    
    setEditingItem(null);
    setEditValue('');
    setError('');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingItem(null);
    setEditValue('');
    setError('');
  };

  // Handle key press in edit input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Generate chapter number (e.g., 1.1, 1.2, 2.1, 2.2)
  const getChapterNumber = (unitIndex: number, chapterIndex: number) => {
    return `${unitIndex + 1}.${chapterIndex + 1}`;
  };

  // Check if currently editing this item
  const isEditing = (unitId: string, chapterId?: string) => {
    return editingItem?.unitId === unitId && editingItem?.chapterId === chapterId;
  };

  const totalChapters = units.reduce((total, unit) => total + unit.chapters.length, 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review Course Structure
        </h2>
        <p className="text-gray-600">
          Your complete course structure is ready. Make any final edits before saving.
        </p>
      </div>

      {/* Course Overview */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">{courseTitle}</h3>
              <p className="text-sm text-gray-600 font-normal">
                {units.length} units • {totalChapters} chapters
              </p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Hierarchical Course Structure */}
      <div className="max-w-4xl mx-auto space-y-4">
        {units.map((unit, unitIndex) => (
          <Card key={unit.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
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
                          className={`text-lg font-semibold ${error ? 'border-red-500' : ''}`}
                          autoFocus
                        />
                        {error && (
                          <p className="text-sm text-red-600">{error}</p>
                        )}
                      </div>
                    ) : (
                      <h4 className="text-lg font-semibold text-gray-900">
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
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={cancelEdit}
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
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
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {unit.chapters.map((chapter, chapterIndex) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0 w-12 h-8 bg-gray-100 text-gray-600 rounded flex items-center justify-center text-sm font-medium">
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
                              className={error ? 'border-red-500' : ''}
                              autoFocus
                            />
                            {error && (
                              <p className="text-sm text-red-600">{error}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {chapter.name}
                            </h5>
                            <div className="flex items-center space-x-2 mt-1">
                              <PlayCircle className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
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
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={cancelEdit}
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => startEditing(unit.id, chapter.id)}
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
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
            className="bg-orange-50 border border-orange-200 rounded-lg"
          />
        </div>
      )}

      {/* Save Button */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Ready to Create Your Course?
              </h3>
              <p className="text-green-700">
                Your course structure looks great! Click below to save and start building your content.
              </p>
            </div>
            
            <Button
              onClick={onSave}
              disabled={isLoading || editingItem !== null}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
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
              <p className="text-sm text-amber-600">
                Please finish editing before saving the course.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}