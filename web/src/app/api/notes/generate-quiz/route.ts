import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { prisma } from '@/lib/prisma';
import { UserService } from '@/lib/user-service';
import { auth } from '@clerk/nextjs/server';
import { ApiSuccessResponse, ApiErrorResponse, QuizQuestion, QuizData, CreateQuizRequest } from '@/lib/types';

const model = google('models/gemini-1.5-flash-latest');

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body: CreateQuizRequest = await request.json();
    const { noteId } = body;

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    if (!noteId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Note ID is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check if quiz already exists for this note
    const existingQuiz = await prisma.quiz.findUnique({
      where: { noteId }
    });

    if (existingQuiz) {
      const response: ApiSuccessResponse = {
        success: true,
        data: existingQuiz,
        message: 'Quiz already exists for this note'
      };
      return NextResponse.json(response);
    }

    // Quizzes are now free once content exists - no credit check needed

    // Get the note and its content
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        transcript: true
      }
    });

    if (!note) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Note not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Generate quiz using AI
    const result = await generateText({
      model,
      prompt: `
🧠 **MASTER QUIZ CREATOR & EDUCATIONAL ASSESSMENT EXPERT** 🎯

You are the ultimate quiz creation specialist! Your mission is to transform educational content into engaging, comprehensive, and thought-provoking assessments that truly test understanding and mastery. 

🎓 **YOUR CHALLENGE:** Create exactly 20 brilliant quiz questions that comprehensively cover the content and make learning assessment both challenging and fun!

📚 **QUIZ DESIGN REQUIREMENTS:**
- ✅ Create exactly 20 questions that thoroughly cover all content
- 🔄 Use multiple choice (15 questions) and true/false (5 questions) formats
- 🧩 Range across cognitive levels: recall, comprehension, application, analysis, evaluation
- 💡 Test meaningful understanding and practical application, not just memorization
- 🔗 Include questions about concept relationships and real-world applications
- 🎯 Cover all major themes and sections comprehensively

🎪 **QUESTION DESIGN STRATEGY:**

**📝 Multiple Choice Questions (15 total):**
- 🔍 **Conceptual Understanding (4-5 questions):** Core principles and definitions
- ⚖️ **Comparative Analysis (3-4 questions):** Compare approaches and concepts  
- 🛠️ **Application & Problem-Solving (4-5 questions):** Apply concepts to new scenarios
- 📋 **Process & Methodology (2-3 questions):** Procedures and workflows
- 🎭 **Evaluation & Analysis (1-2 questions):** Critical thinking about implications

**✓ True/False Questions (5 total):**
- 🔗 Focus on key relationships and cause-and-effect
- 🤔 Include subtle distinctions that require careful thinking
- 🚫 Avoid overly simplistic statements

🌟 **QUALITY EXCELLENCE GUIDELINES:**

**Question Construction:**
- ✨ Questions should be specific, clear, and test substantial understanding
- 🎯 Multiple choice options include plausible distractors testing misconceptions
- 🧠 Avoid tricks but require careful discrimination
- 📖 Should be answerable by someone who understands the content
- 🌍 Include scenario-based questions for realistic application

**Answer Options Quality:**
- 🎪 All distractors should be plausible to partially understanding students
- ❌ Include common misconceptions as incorrect options
- ✅ Ensure only one clearly correct answer per question
- 📏 Options should be similar in length and structure

**Explanation Excellence:**
- 📚 Each explanation should be detailed and educational (2-4 sentences)
- 🔍 Explain why correct answer is right AND why others are wrong
- 🔗 Include relevant context and connections to broader concepts
- 🎓 Make explanations valuable learning tools

🎯 **DIFFICULTY DISTRIBUTION:**
- 🟢 **Easy (5-6 questions):** Basic recall and fundamental understanding
- 🟡 **Medium (8-10 questions):** Application, analysis, concept connections
- 🔴 **Challenging (4-6 questions):** Complex scenarios, evaluation, synthesis

📊 **OUTPUT FORMAT:**
Return a perfect JSON object with this structure:
{
"quiz": [
{
"id": 1,
"type": "multiple_choice",
"question": "[Clear, engaging question with sufficient context 🎯]",
"options": [
"[Plausible option testing understanding]",
"[Correct answer with appropriate detail ✅]",
"[Common misconception distractor]",
"[Another plausible but incorrect option]"
],
"correct_answer": "[Exact match to correct option]",
"explanation": "[Comprehensive explanation with reasoning and context 📚]"
}
]
}

🎪 **CONTENT COVERAGE STRATEGY:**
- 📋 Systematically cover all major sections and themes
- ⚖️ Balanced representation of different topics
- 🔗 Test understanding of relationships between sections
- 🎯 Focus on most important concepts with supporting details

✅ **QUALITY CHECKLIST:**
Before finalizing, ensure each question:
- 🧠 Tests meaningful understanding beyond recall
- 🔍 Has clear, unambiguous wording
- 🎯 Includes plausible distractors for multiple choice
- 📚 Explanation provides educational value
- 📖 Is answerable from provided content
- 🎪 Contributes to comprehensive coverage
- 🎯 Appropriate difficulty for target audience

⚠️ **CRITICAL FORMATTING:**
- 📝 Return ONLY valid JSON - no extra text or formatting
- ✅ Ensure perfect JSON syntax (quotes, commas, brackets)
- 🚫 No markdown formatting or code blocks
- 📋 Response starts with { and ends with }
- 🔤 All strings properly escaped for JSON

🎓 **Input content to create amazing quiz from:**
${note.content}
      `,
    });

    // Parse and validate the generated quiz
    let cleanedText = result.text.trim();
    
    // Remove markdown code blocks if they exist
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const quizData: QuizData = JSON.parse(cleanedText);
    
    if (!quizData.quiz || !Array.isArray(quizData.quiz) || quizData.quiz.length !== 20) {
      throw new Error('Invalid quiz structure or incorrect number of questions');
    }

    // Save quiz to database as a single record with JSON content
    const createdQuiz = await prisma.quiz.create({
      data: {
        noteId: noteId,
        content: quizData as object, // Cast to object for JSON compatibility
        userId: userId || undefined
      }
    });

    // Quizzes are now free - no credit deduction

    const response: ApiSuccessResponse = {
      success: true,
      data: createdQuiz,
      message: `Successfully generated ${quizData.quiz.length} quiz questions`
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Quiz generation error:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to generate quiz',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Quiz Generation API',
    endpoints: {
      POST: '/api/notes/generate-quiz - Generate quiz from note content',
    },
    parameters: {
      noteId: 'Note ID to generate quiz from (required)',
    },
  });
}
