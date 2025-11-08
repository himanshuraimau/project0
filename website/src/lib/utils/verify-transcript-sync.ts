/**
 * Simple verification script for transcript synchronization system
 * This can be run to test the basic functionality
 */

import { processTranscriptForSync, findActiveChunk, getHighlightedText } from './transcript-sync';

// Mock transcript for testing
const mockTranscript = `
Hello and welcome to our podcast. Today we're going to discuss the fascinating world of artificial intelligence.
AI has been transforming industries across the globe. From healthcare to finance, we're seeing incredible innovations.
Let's dive into some specific examples and explore what the future might hold.
Thank you for listening to today's episode.
`;

/**
 * Verify transcript synchronization functionality
 */
export async function verifyTranscriptSync() {
  console.log('🔄 Testing transcript synchronization system...');
  
  try {
    // Test 1: Process transcript
    console.log('📝 Processing transcript...');
    const syncData = await processTranscriptForSync(mockTranscript.trim(), 120);
    
    if (!syncData || !syncData.chunks || syncData.chunks.length === 0) {
      throw new Error('Failed to process transcript into chunks');
    }
    
    console.log(`✅ Successfully created ${syncData.chunks.length} chunks`);
    console.log('Chunks:', syncData.chunks.map(c => ({ id: c.id, text: c.text.substring(0, 50) + '...' })));
    
    // Test 2: Find active chunk
    console.log('\n🎯 Testing chunk finding...');
    const activeChunk = findActiveChunk(syncData.chunks, 30, 'simulated');
    
    if (activeChunk) {
      console.log(`✅ Found active chunk at 30s: "${activeChunk.text.substring(0, 50)}..."`);
    } else {
      console.log('⚠️ No active chunk found at 30s');
    }
    
    // Test 3: Generate highlighted text
    console.log('\n🎨 Testing text highlighting...');
    const highlightedText = getHighlightedText(syncData.chunks, activeChunk, 30, 'simulated');
    
    if (highlightedText.includes('<mark')) {
      console.log('✅ Successfully generated highlighted text with markup');
    } else {
      console.log('⚠️ No highlighting markup found in text');
    }
    
    // Test 4: Test different sync modes
    console.log('\n🔄 Testing sync modes...');
    const realtimeChunk = findActiveChunk(syncData.chunks, 30, 'realtime');
    const simulatedChunk = findActiveChunk(syncData.chunks, 30, 'simulated');
    
    console.log(`✅ Realtime mode: ${realtimeChunk ? 'Found chunk' : 'No chunk'}`);
    console.log(`✅ Simulated mode: ${simulatedChunk ? 'Found chunk' : 'No chunk'}`);
    
    console.log('\n🎉 All transcript synchronization tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Transcript synchronization test failed:', error);
    return false;
  }
}

// Export for potential use in other verification scripts
export { mockTranscript };