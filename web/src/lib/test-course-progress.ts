// Test utility for course progress functionality
// This file can be used for manual testing or removed after verification

export async function testCourseProgress(courseId: string) {
  try {
    console.log('Testing course progress API...');
    
    // Test GET - initial state
    console.log('1. Getting initial progress...');
    const getResponse = await fetch(`/api/course/${courseId}/progress`);
    const initialProgress = await getResponse.json();
    console.log('Initial progress:', initialProgress);
    
    // Test POST - mark as complete
    console.log('2. Marking as complete...');
    const postResponse = await fetch(`/api/course/${courseId}/progress`, {
      method: 'POST',
    });
    const completedProgress = await postResponse.json();
    console.log('After completion:', completedProgress);
    
    // Test GET - verify completion
    console.log('3. Verifying completion...');
    const verifyResponse = await fetch(`/api/course/${courseId}/progress`);
    const verifiedProgress = await verifyResponse.json();
    console.log('Verified progress:', verifiedProgress);
    
    // Test DELETE - undo completion
    console.log('4. Undoing completion...');
    const deleteResponse = await fetch(`/api/course/${courseId}/progress`, {
      method: 'DELETE',
    });
    const undoneProgress = await deleteResponse.json();
    console.log('After undo:', undoneProgress);
    
    console.log('Course progress API test completed successfully!');
    return true;
  } catch (error) {
    console.error('Course progress API test failed:', error);
    return false;
  }
}

// Usage example:
// testCourseProgress('your-course-id-here');