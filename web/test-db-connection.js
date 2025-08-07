const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test querying the transcript model
    const transcriptCount = await prisma.transcript.count();
    console.log(`✅ Found ${transcriptCount} transcripts in database`);
    
    // Test creating a sample transcript (optional)
    console.log('Testing transcript creation...');
    const testTranscript = await prisma.transcript.create({
      data: {
        fileName: 'test-connection.pdf',
        originalName: 'Test Connection File.pdf',
        content: 'This is a test content',
        cleanContent: 'This is a test content',
        pages: 1,
        metadata: { test: true },
        userId: 'test-user-id',
      },
    });
    console.log('✅ Test transcript created:', testTranscript.id);
    
    // Clean up test data
    await prisma.transcript.delete({
      where: { id: testTranscript.id },
    });
    console.log('✅ Test transcript deleted');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

testConnection();
