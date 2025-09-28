"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitsGenerationStepProps, Unit } from "@/lib/types/course.types";
import { Plus, Trash2, Edit3, Check, X } from "lucide-react";
import { LoadingState, InlineLoading } from "@/components/ui/loading-spinner";
import {
  validateUnitName,
  sanitizeString,
  validateContentSafety,
} from "@/lib/utils/validation";

/**
 * UnitsGenerationStep component handles display and editing of generated course units
 * Allows users to add, remove, and edit units with real-time validation
 */
export function UnitsGenerationStep({
  units,
  onUnitsChange,
  onFinalize,
  isLoading,
}: UnitsGenerationStepProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Start editing a unit
  const startEditing = (unit: Unit) => {
    setEditingId(unit.id);
    setEditValue(unit.name);
    setError("");
  };

  // Save edited unit
  const saveEdit = () => {
    // Enhanced validation using validation utilities
    const unitValidation = validateUnitName(editValue);
    if (!unitValidation.isValid) {
      setError(unitValidation.error || "Invalid unit name");
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
      setError("Invalid characters in unit name");
      return;
    }

    const updatedUnits = units.map((unit) =>
      unit.id === editingId ? { ...unit, name: sanitizedValue } : unit
    );

    onUnitsChange(updatedUnits);
    setEditingId(null);
    setEditValue("");
    setError("");
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
    setError("");
  };

  // Add new unit
  const addUnit = () => {
    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      name: "",
      isEditing: true,
    };

    const updatedUnits = [...units, newUnit];
    onUnitsChange(updatedUnits);
    setEditingId(newUnit.id);
    setEditValue("");
    setError("");
  };

  // Remove unit
  const removeUnit = (unitId: string) => {
    const updatedUnits = units.filter((unit) => unit.id !== unitId);
    onUnitsChange(updatedUnits);

    // If we're editing the unit being removed, clear editing state
    if (editingId === unitId) {
      setEditingId(null);
      setEditValue("");
      setError("");
    }
  };

  // Handle key press in edit input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  // Validate units before finalization
  const validateUnits = () => {
    if (units.length === 0) {
      setError("At least one unit is required");
      return false;
    }

    // Enhanced validation for each unit
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];

      // Use validation utility
      const unitValidation = validateUnitName(unit.name);
      if (!unitValidation.isValid) {
        setError(`Unit ${i + 1}: ${unitValidation.error}`);
        return false;
      }

      // Content safety check
      const safetyCheck = validateContentSafety(unit.name);
      if (!safetyCheck.isSafe) {
        setError(
          `Unit ${i + 1} contains inappropriate content: ${safetyCheck.reason}`
        );
        return false;
      }
    }

    return true;
  };

  // Handle finalize button click
  const handleFinalize = () => {
    if (editingId) {
      setError("Please finish editing before finalizing");
      return;
    }

    if (validateUnits()) {
      setError("");
      onFinalize();
    }
  };

  const canFinalize =
    units.length > 0 &&
    units.every((unit) => unit.name.trim()) &&
    !editingId &&
    !isLoading;

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Review and Edit Units
        </h2>
        <p className="text-muted-foreground">
          AI has generated course units for you. Edit, add, or remove units as
          needed.
        </p>
      </div>

      <Card className="max-w-2xl bg-transparent border-none mx-auto">
        <CardHeader>
          <CardTitle className="flex mb-2.5 items-center justify-between">
            <span>Course Units ({units.length})</span>
            <Button
              onClick={addUnit}
              size="sm"
              disabled={isLoading}
              className="flex cursor-pointer items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Unit</span>
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {units.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No units generated yet.</p>
              <p className="text-sm mt-1">
                Click Add Unit to create your first unit.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {units.map((unit, index) => (
                <div
                  key={unit.id}
                  className="flex items-center border-none bg-card space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    {editingId === unit.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="Enter unit name..."
                          className={error ? "border-destructive" : ""}
                          autoFocus
                        />
                        {error && (
                          <p className="text-sm text-destructive">{error}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span
                          className={`${
                            !unit.name.trim()
                              ? "text-muted-foreground italic"
                              : "text-foreground font-medium"
                          }`}
                        >
                          {unit.name.trim() ||
                            "Empty unit - click edit to add name"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {editingId === unit.id ? (
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
                          onClick={() => startEditing(unit)}
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          className="text-muted-foreground hover:text-foreground cursor-pointer hover:bg-accent/10"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => removeUnit(unit.id)}
                          variant="ghost"
                          size="sm"
                          disabled={isLoading || units.length <= 1}
                          className="text-destructive hover:text-destructive/80 cursor-pointer hover:bg-destructive/10 disabled:text-muted-foreground"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && !editingId && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <div className="max-w-2xl mx-auto mt-6">
          <LoadingState
            message="Generating Course Chapters"
            submessage="AI is creating 3-5 chapters for each unit with YouTube search queries..."
            variant="ai"
          />
        </div>
      )}

      {units.length > 0 && !isLoading && (
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleFinalize}
            disabled={!canFinalize}
            className="w-full cursor-pointer"
            size="lg"
          >
            {isLoading ? (
              <InlineLoading
                message="Generating Chapters..."
                variant="ai"
                className="text-white"
              />
            ) : (
              "Finalize Units & Generate Chapters"
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center mt-2">
            This will automatically generate 3-5 chapters for each unit using
            AI.
          </p>
        </div>
      )}
    </div>
  );
}
