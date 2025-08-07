import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testPDFWorkflow() {
  console.log('🧪 Testing PDF AI Note Generation Workflow...\n');
  
  try {
    // Check if test PDF exists
    const testPDFPath = '/home/nyx/Projects/project0/web/test/data/05-versions-space.pdf';
    
    if (!fs.existsSync(testPDFPath)) {
      console.log('⚠️  Test PDF not found, creating a minimal test...');
      // You can upload any PDF file for testing
      console.log('Please upload a PDF file through the web interface at http://localhost:3001/pdf-demo');
      return;
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testPDFPath));
    formData.append('generateNotes', 'true');
    formData.append('extractImages', 'false');

    console.log('📤 Uploading PDF and generating notes...');
    
    // Test the complete workflow endpoint
    const response = await fetch('http://localhost:3001/api/pdf/process', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ PDF processing successful!');
      console.log('📄 Transcript ID:', result.data.transcript.id);
      console.log('📝 Note generated:', result.data.note ? 'Yes' : 'No');
      
      if (result.data.note && !result.data.note.error) {
        console.log('📝 Note title:', result.data.note.title);
        console.log('📝 Note content length:', result.data.note.content?.length || 0, 'characters');
      } else if (result.data.note?.error) {
        console.log('❌ Note generation failed:', result.data.note.message);
      }
    } else {
      console.log('❌ Processing failed:', result.message);
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

// Run the test
testPDFWorkflow();
