"use client";

import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Eye } from "lucide-react";

export function LoadingNotesDebug() {
  const { loadingNotes, clearAllLoadingNotes } = useDashboardRefresh();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4" />
          Loading Notes Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <div className="font-medium mb-2">Active Shimmers: {loadingNotes.length}</div>
          {loadingNotes.length === 0 ? (
            <div className="text-muted-foreground">No active shimmers</div>
          ) : (
            <div className="space-y-1">
              {loadingNotes.map((note, index) => (
                <div key={note.id} className="text-xs bg-muted p-2 rounded">
                  <div><strong>#{index + 1}</strong></div>
                  <div><strong>ID:</strong> {note.id}</div>
                  <div><strong>Type:</strong> {note.type}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {loadingNotes.length > 0 && (
          <Button 
            onClick={clearAllLoadingNotes}
            variant="destructive" 
            size="sm"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Shimmers
          </Button>
        )}
      </CardContent>
    </Card>
  );
}