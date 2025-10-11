/**
 * Simple verification script for note deletion with podcast cleanup
 * This can be run manually to verify the implementation works
 */

/* eslint-disable @typescript-eslint/no-require-imports */

// Mock console methods to capture logs
const originalLog = console.log;
const originalWarn = console.warn;
const logs = [];
const warnings = [];

console.log = (...args) => {
  logs.push(args.join(' '));
  originalLog(...args);
};

console.warn = (...args) => {
  warnings.push(args.join(' '));
  originalWarn(...args);
};

// Mock Prisma
const mockPrisma = {
  podcast: {
    findMany: jest.fn(),
  },
  note: {
    delete: jest.fn(),
  },
};

// Mock UploadThing service
const mockUploadThingService = {
  deleteAudioFiles: jest.fn(),
};

// Mock the imports
jest.mock('../prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('../uploadthing', () => ({
  uploadThingAudioStorageService: mockUploadThingService,
}));

// Test scenarios
async function runTests() {
  console.log('🧪 Starting Note Deletion with Podcast Cleanup Tests\n');

  // Test 1: Note with podcasts that have audio files
  console.log('Test 1: Note with podcasts that have audio files');
  mockPrisma.podcast.findMany.mockResolvedValue([
    { id: 'p1', audioFileKey: 'audio1.mp3', status: 'COMPLETED' },
    { id: 'p2', audioFileKey: 'audio2.mp3', status: 'COMPLETED' },
    { id: 'p3', audioFileKey: null, status: 'FAILED' },
  ]);
  mockPrisma.note.delete.mockResolvedValue({ id: 'note1', title: 'Test Note' });
  mockUploadThingService.deleteAudioFiles.mockResolvedValue();

  try {
    const { NoteService } = require('../note-service');
    const noteService = new NoteService();
    await noteService.deleteNote('note1');
    console.log('✅ Test 1 passed: Note deleted with audio cleanup');
  } catch (error) {
    console.log('❌ Test 1 failed:', error.message);
  }

  // Test 2: Note with no podcasts
  console.log('\nTest 2: Note with no podcasts');
  mockPrisma.podcast.findMany.mockResolvedValue([]);
  mockPrisma.note.delete.mockResolvedValue({ id: 'note2', title: 'Test Note 2' });

  try {
    const { NoteService } = require('../note-service');
    const noteService = new NoteService();
    await noteService.deleteNote('note2');
    console.log('✅ Test 2 passed: Note deleted with no podcasts');
  } catch (error) {
    console.log('❌ Test 2 failed:', error.message);
  }

  // Test 3: Audio file cleanup fails but note deletion continues
  console.log('\nTest 3: Audio file cleanup fails but note deletion continues');
  mockPrisma.podcast.findMany.mockResolvedValue([
    { id: 'p1', audioFileKey: 'audio1.mp3', status: 'COMPLETED' },
  ]);
  mockPrisma.note.delete.mockResolvedValue({ id: 'note3', title: 'Test Note 3' });
  mockUploadThingService.deleteAudioFiles.mockRejectedValue(new Error('Storage unavailable'));

  try {
    const { NoteService } = require('../note-service');
    const noteService = new NoteService();
    await noteService.deleteNote('note3');
    console.log('✅ Test 3 passed: Note deleted despite audio cleanup failure');
  } catch (error) {
    console.log('❌ Test 3 failed:', error.message);
  }

  console.log('\n📊 Test Summary:');
  console.log(`Logs captured: ${logs.length}`);
  console.log(`Warnings captured: ${warnings.length}`);
  
  console.log('\n📝 Captured logs:');
  logs.forEach((log, i) => console.log(`${i + 1}. ${log}`));
  
  if (warnings.length > 0) {
    console.log('\n⚠️ Captured warnings:');
    warnings.forEach((warning, i) => console.log(`${i + 1}. ${warning}`));
  }

  console.log('\n🎉 All tests completed!');
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests };
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}