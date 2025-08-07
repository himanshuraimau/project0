#!/usr/bin/env bun

// This script tests the PDF processing and AI note generation workflow
// Run with: bun test-pdf-workflow.ts

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

async function testPDFWorkflow() {
  console.log('🚀 Testing PDF to AI Notes Workflow...\n');

  // Check if we have a test PDF
  const testPDFPath = join(process.cwd(), 'test', 'data', '05-versions-space.pdf');
  
  if (!existsSync(testPDFPath)) {
    console.log('❌ Test PDF not found at:', testPDFPath);
    console.log('Please add a test PDF to test the workflow');
    return;
  }

  try {
    // Test 1: PDF Processing API
    console.log('📄 Step 1: Testing PDF processing...');
    
    const formData = new FormData();
    const pdfBuffer = readFileSync(testPDFPath);
    const pdfFile = new File([pdfBuffer], '05-versions-space.pdf', { type: 'application/pdf' });
    
    formData.append('file', pdfFile);
    formData.append('generateNotes', 'true');

    const response = await fetch('http://localhost:3000/api/pdf/process', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ PDF processed successfully!');
      console.log(`   - Transcript ID: ${result.data.transcript.id}`);
      console.log(`   - Pages processed: ${result.data.transcript.pages}`);
      console.log(`   - Text length: ${result.data.transcript.cleanText.length} characters`);
      
      if (result.data.note && !result.data.note.error) {
        console.log('✅ AI Notes generated successfully!');
        console.log(`   - Note ID: ${result.data.note.id}`);
        console.log(`   - Note title: ${result.data.note.title}`);
        console.log(`   - Note length: ${result.data.note.content.length} characters`);
      } else if (result.data.note?.error) {
        console.log('⚠️  AI Note generation failed:', result.data.note.message);
      }

      // Test 2: Retrieve notes
      console.log('\n📋 Step 2: Testing notes retrieval...');
      
      const notesResponse = await fetch(`http://localhost:3000/api/notes?transcriptId=${result.data.transcript.id}`);
      const notesResult = await notesResponse.json();
      
      if (notesResult.success) {
        console.log(`✅ Retrieved ${notesResult.data.length} notes for the transcript`);
      } else {
        console.log('❌ Failed to retrieve notes:', notesResult.message);
      }

    } else {
      console.log('❌ PDF processing failed:', result.message);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Test failed:', errorMessage);
    
    if (errorMessage.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure the Next.js development server is running:');
      console.log('   bun run dev');
    }
  }
}

// Only run if this script is executed directly
testPDFWorkflow();

export { testPDFWorkflow };
