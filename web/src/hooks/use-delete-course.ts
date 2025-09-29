"use client";

import { useState } from "react";
import { toast } from "sonner";

export function useDeleteCourse() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteCourse = async (courseId: string) => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/course/${courseId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete course");
      }

      toast.success("Course deleted successfully");
      
      // Refresh the page to update the course list
      window.location.reload();
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting course:", error);
      const message = error instanceof Error ? error.message : "Failed to delete course";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteCourse,
    isDeleting,
  };
}