import { prisma } from "./prisma";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { indexNoteContent } from "./course/embedding-service";
import {
  NoteData,
  NoteType,
  GeneratedNoteResult,
  NotesFromContentResult,
} from "@/lib/types/notes.types";

const DEFAULT_OPENROUTER_MODEL = "google/gemini-3.1-flash-lite-preview";
const DEFAULT_OPENAI_MODEL = "gpt-5-mini";
const DEFAULT_NOTE_MAX_OUTPUT_TOKENS = 12000;
const DEFAULT_FALLBACK_MODEL_MAX_OUTPUT_TOKENS = 8192;

const MODEL_MAX_OUTPUT_TOKEN_LIMITS: Array<{
  pattern: RegExp;
  maxTokens: number;
}> = [
  // GPT-5 family
  { pattern: /^gpt-5(\b|[-.])/i, maxTokens: 128000 },
  // GPT-4o family
  { pattern: /^gpt-4o-mini(\b|[-.])/i, maxTokens: 16384 },
  { pattern: /^gpt-4o(\b|[-.])/i, maxTokens: 16384 },
];

function getModelMaxOutputTokens(modelName: string): number {
  for (const { pattern, maxTokens } of MODEL_MAX_OUTPUT_TOKEN_LIMITS) {
    if (pattern.test(modelName)) {
      return maxTokens;
    }
  }

  // Conservative fallback prevents provider hard-failures on unknown models.
  return DEFAULT_FALLBACK_MODEL_MAX_OUTPUT_TOKENS;
}

function resolveNoteMaxOutputTokens(modelName: string) {
  const requested = Number(
    process.env.NOTE_MAX_OUTPUT_TOKENS ?? DEFAULT_NOTE_MAX_OUTPUT_TOKENS,
  );
  const configuredModelMax = Number(process.env.NOTE_MODEL_MAX_OUTPUT_TOKENS);

  const modelMax =
    Number.isFinite(configuredModelMax) && configuredModelMax > 0
      ? Math.floor(configuredModelMax)
      : getModelMaxOutputTokens(modelName);

  const safeRequested = Number.isFinite(requested)
    ? Math.floor(requested)
    : DEFAULT_NOTE_MAX_OUTPUT_TOKENS;

  return Math.max(256, Math.min(safeRequested, modelMax));
}

function createNoteGenerationModelConfig() {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterApiKey) {
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openRouterApiKey,
    });
    const modelName =
      process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;

    return {
      model: openrouter.chat(modelName),
      modelName,
    };
  }

  const openAIApiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAIApiKey) {
    const openai = createOpenAI({ apiKey: openAIApiKey });
    const modelName = process.env.CHAT_MODEL?.trim() || DEFAULT_OPENAI_MODEL;

    return {
      model: openai.chat(modelName),
      modelName,
    };
  }

  throw new Error(
    "No AI provider credentials found for note generation. Set OPENROUTER_API_KEY or OPENAI_API_KEY.",
  );
}

export class NoteService {
  private modelConfig = createNoteGenerationModelConfig();
  private model = this.modelConfig.model;
  private maxOutputTokens = resolveNoteMaxOutputTokens(
    this.modelConfig.modelName,
  );

  /** Provider options for OpenRouter */
  private providerOptions = {};

  /**
   * Get content-specific instructions based on transcript type
   */
  private getContentSpecificInstructions(contentType: string): string {
    const instructions = {
      pdf: `## CONTENT TYPE: PDF Document

**Special Focus Areas for PDF Content:**
- This content comes from a document, likely containing structured information, diagrams, or formal content
- Pay attention to any tables, figures, or structured data that may be referenced
- Academic or professional documents may contain citations, references, or formal terminology
- Preserve the logical flow and hierarchical structure of the original document
- If the content appears to be from textbooks or academic papers, emphasize theoretical foundations
- For technical manuals or guides, focus on step-by-step procedures and practical implementation
- Business documents should emphasize strategic insights, data analysis, and actionable recommendations`,

      audio: `## CONTENT TYPE: Audio Recording / Transcription

**Special Focus Areas for Audio Content:**
- This content comes from spoken audio (lecture, meeting, or voice recording)
- The original format was conversational - translate verbal explanations into clear written concepts
- Speaker may have used informal language, filler words, or repetition - distill the core message
- Verbal emphasis and tone cannot be conveyed - ensure critical points are clearly highlighted in text
- Multiple speakers may be present - organize ideas logically rather than chronologically
- Anecdotes or examples from speech should be preserved as they aid understanding
- Transcription may contain errors - use context to ensure accuracy of technical terms
- Focus on extracting the key insights and organizing them into coherent study material`,

      youtube: `## CONTENT TYPE: YouTube Video Transcript

**Special Focus Areas for YouTube Content:**
- This content comes from a video, likely including visual demonstrations or screen content
- The speaker may reference "as you can see" or point to visual elements - describe these conceptually
- Tutorial videos: Focus on the step-by-step process being demonstrated
- Educational videos: Extract the teaching methodology and key learning points
- Presentation videos: Capture both the verbal content and implied visual structure
- The casual or engaging tone of video content should be translated into clear, professional notes
- Time-sensitive information (current events, trends) should be noted with appropriate context
- If demonstrations were shown, describe the process and outcomes in detailed written form`,

      webpage: `## CONTENT TYPE: Web Article / Blog Post

**Special Focus Areas for Web Content:**
- This content comes from online publication, optimized for web reading
- May contain hyperlinks, embedded media, or interactive elements - focus on the core information
- Web articles often have a journalistic or informal tone - maintain professionalism while preserving clarity
- Content may be time-sensitive - note dates, current contexts, or evolving situations
- Multiple formats may be mixed (lists, quotes, images) - integrate into coherent study notes
- Author's perspective and potential bias should be noted for balanced understanding
- Practical tips, how-to guides, or tutorials should maintain their actionable nature
- Blog content: Extract substantive knowledge while filtering opinion from fact`,

      text: `## CONTENT TYPE: Plain Text / General Content

**Special Focus Areas for Text Content:**
- This is general text content without specific source formatting
- Focus on extracting the core knowledge and organizing it logically
- Identify the main themes, concepts, and relationships between ideas
- Structure the information in a way that facilitates learning and retention
- Ensure clarity and comprehension regardless of the original format
- Adapt the depth of explanation based on the complexity of the content`,
    };

    return (
      instructions[contentType as keyof typeof instructions] ||
      instructions["text"]
    );
  }

  /**
   * Generate AI summary notes from transcript content
   */
  async generateAINote(
    transcriptId: string,
    userId?: string,
    folderId?: string,
  ): Promise<GeneratedNoteResult> {
    try {
      // Get the transcript data
      const transcript = await prisma.transcript.findUnique({
        where: { id: transcriptId },
        select: {
          id: true,
          originalName: true,
          cleanContent: true,
          content: true,
          type: true,
          createdAt: true,
          notes: {
            select: {
              id: true,
              title: true,
              createdAt: true,
            },
          },
        },
      });

      if (!transcript) {
        throw new Error("Transcript not found");
      }

      // Check if notes already exist for this transcript
      if (transcript.notes && transcript.notes.length > 0) {
        console.log(
          `Warning: ${transcript.notes.length} existing notes found for transcript ${transcriptId}`,
        );
      }

      // Use the clean content for better AI processing
      const contentToAnalyze = transcript.cleanContent || transcript.content;

      // Validate that we have content to analyze
      if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
        throw new Error(
          "No content available in transcript to generate notes from",
        );
      }

      // Add timestamp and uniqueness factors to the prompt
      const timestamp = new Date().toISOString();
      const analysisId = Math.random().toString(36).substring(2, 15);

      // Determine content-specific prompt based on transcript type
      const contentType = transcript.type || "text";
      const contentSpecificInstructions =
        this.getContentSpecificInstructions(contentType);

      // Trim content to ~60k chars to stay within model context limits
      const trimmedContent = contentToAnalyze.length > 60000
        ? contentToAnalyze.substring(0, 60000) + '\n\n[Content truncated for processing]'
        : contentToAnalyze;

      // Generate AI summary using content-specific prompts
      const result = await generateText({
        model: this.model,
        maxOutputTokens: this.maxOutputTokens,
        providerOptions: this.providerOptions,
        prompt: `You are a world-class visual note designer and educational content architect. Your mission is to transform raw content into EXTREMELY DETAILED, beautifully designed, and visually stunning study notes. Think of yourself as creating a premium Notion template combined with an infographic — every section should be rich, thorough, and a joy to read.

Document: ${transcript.originalName}
Content Type: ${contentType}

${contentSpecificInstructions}

## YOUR MISSION

Create THE MOST COMPREHENSIVE, visually rich, and information-dense notes possible. These notes should be SO detailed and well-designed that a student could use them as their SOLE study resource and ace any exam on this topic. Every concept must be explained thoroughly with examples, analogies, and visual aids. Do NOT summarize — EXPAND and ENRICH the content.

## CRITICAL LENGTH REQUIREMENT

Your output MUST be extremely long and detailed. Target:
- **Minimum 6,000 words** of actual content (not counting SVG/Mermaid code)
- **8-12 major sections** minimum, each with substantial depth
- **Every concept** gets its own detailed explanation with examples
- **Every section** should have 200-500+ words of written content
- If the source material is short, you must EXPAND on each point with deeper explanations, real-world examples, analogies, use cases, comparisons, and practical applications
- NEVER be brief. ALWAYS be thorough. When in doubt, write MORE.

## OUTPUT STRUCTURE

### 1. Title & Hero Visual
\`# [emoji] [Descriptive Title]\`

Immediately after the title, create a large, detailed inline SVG that serves as a visual overview/roadmap of the entire topic. This hero SVG should be comprehensive — showing the relationships between ALL major concepts.

### 2. Executive Summary Box
A callout block with a 150-250 word overview:
\`> [!IMPORTANT]\`
\`> **What you'll learn:** [comprehensive overview of all topics covered]\`

### 3. Key Highlights
8-12 bullet points (not just 4-7) with the most important takeaways. Each bullet should be a complete sentence with context, not just a phrase. Prefix each with a relevant emoji.

### 4. Main Sections (8-12 dynamic sections — BE GENEROUS)

Each section MUST include:
- \`## [emoji] [Dynamic Title]\` based on actual content themes
- **Opening paragraph** (3-5 sentences) introducing the section topic
- **Detailed explanation** with multiple paragraphs covering every nuance
- **At least one visual element** per section (table, SVG, Mermaid diagram, or callout)
- **Practical examples or real-world applications** where relevant
- **Key definitions** in bold for important terms

Mix these formats RICHLY within each section:
- **Tables** for structured/comparative data — use tables LIBERALLY (at least 4-6 tables total across all sections). Tables with 3-6 columns and 4-8 rows showing comparisons, features, pros/cons, steps, metrics
- **Detailed bullet points** with explanations (not single words — full sentences)
- **Numbered lists** for step-by-step processes with descriptions for each step
- **Mermaid diagrams** for processes, decision trees, or hierarchies (3-4 total across notes)
- **Inline SVGs** for concept visualizations (3-5 total across notes including hero)
- **Callout blocks** for critical formulas, definitions, pro tips, or warnings (4-6 total)
- **Code blocks** if the content is technical
- **Blockquotes** for important quotes or key phrases from the source

### 5. Connections & Relationships Section
\`## 🔗 How It All Connects\`
A dedicated section with an SVG or Mermaid diagram showing how all the major concepts relate to each other, plus written explanation.

### 6. Practical Applications Section
\`## 🎯 Practical Applications & Examples\`
Real-world applications, use cases, scenarios, or worked examples. Make the content actionable.

### 7. Common Misconceptions or Pitfalls (if applicable)
\`## ⚠️ Common Mistakes & Misconceptions\`
Using \`> [!WARNING]\` callouts for each misconception with detailed corrections.

### 8. Quick Reference Table
\`## 📋 Quick Reference\`
A comprehensive summary table with all key terms, definitions, and important values in one place.

### 9. Key Takeaways
\`## 🔑 Key Takeaways\` — 8-12 detailed bullets of the most critical points, each with WHY it matters.

---

## SVG RULES (STRICT)

- Use \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 H" width="100%">\` where H fits the content
- Make SVGs LARGER and more detailed than minimal — aim for H=200-400 for hero, H=150-250 for section SVGs
- Safe content area: x=40 to x=640
- Background: transparent
- Font: sans-serif only, font-size 14px for titles (font-weight 500), 12px for labels (font-weight 400)
- Minimum font-size: 11px. Never use font-weight 600 or 700 in SVGs.
- Colors: use soft flat fills. Light-mode friendly palette:
  - Purple: fill="#EEEDFE" stroke="#534AB7" text="#26215C"
  - Teal: fill="#E1F5EE" stroke="#0F6E56" text="#04342C"
  - Coral: fill="#FAECE7" stroke="#993C1D" text="#4A1B0C"
  - Blue: fill="#E6F1FB" stroke="#185FA5" text="#042C53"
  - Green: fill="#EAF3DE" stroke="#3B6D11" text="#1E3808"
  - Amber: fill="#FAEEDA" stroke="#854F0B" text="#412402"
  - Gray: fill="#F1EFE8" stroke="#5F5E5A" text="#2C2C2A"
- Rounded rects: rx="8" for nodes, stroke-width="0.5"
- Arrows: use \`<line>\` or \`<path>\` with marker-end for flow arrows
- Text: always use \`text-anchor="middle" dominant-baseline="central"\` for centering
- NO gradients, NO shadows, NO blur, NO glow effects, NO comments in SVG code
- SVG types: flow diagram, concept map, comparison layout, layered architecture, timeline, matrix grid, cycle diagram
- 4-10 nodes per SVG, clear labels

### SVG VARIETY — use DIFFERENT SVG types across sections:
1. **Hero SVG**: Large concept map or architecture overview (8-10 nodes)
2. **Process SVGs**: Flow diagrams with arrows showing sequences
3. **Comparison SVGs**: Side-by-side boxes comparing approaches/concepts
4. **Architecture SVGs**: Stacked layers showing hierarchies
5. **Cycle SVGs**: Circular flow showing iterative processes
6. **Matrix SVGs**: Grid layout comparing multiple dimensions

## MERMAID DIAGRAM RULES (VERY STRICT)
- Use \`\`\`mermaid code blocks
- ONLY \`flowchart TD\` or \`flowchart LR\`
- Max 4-8 nodes, labels must be 2-5 plain English words
- Node syntax: A[Label Text] for boxes, B{Question} for decisions, C(Rounded)
- FORBIDDEN in labels: quotes, colons, semicolons, parentheses, emojis, <br>, HTML tags, special characters
- FORBIDDEN: subgraphs, style/class statements, click events
- GOOD: A[Upload Content] --> B[Process Data]
- BAD: A["Upload: Content 📚"] --> B["Process<br>Data"]

## CALLOUT SYNTAX
- \`> [!TIP]\` for best practices and pro tips
- \`> [!IMPORTANT]\` for critical concepts, formulas, or must-know info
- \`> [!WARNING]\` for common mistakes, pitfalls, or misconceptions
- \`> [!NOTE]\` for additional context or interesting facts

## VISUAL RHYTHM GUIDELINES

NEVER have more than 1 consecutive text-only section. Every section needs at least one visual:
1. Hero SVG after the title (ALWAYS — large and detailed)
2. Executive summary callout
3. 2-4 more inline SVGs throughout the body (different types!)
4. 3-4 Mermaid diagrams for processes and decisions
5. 4-6 callout blocks spread throughout
6. 4-6 data tables for structured information
7. Total visuals per note: 10-15+ visual elements (SVGs + Mermaid + tables + callouts)

## HARD RULES

1. **SOURCE ONLY**: Only information from the provided content. No hallucination.
2. **NO REPETITION**: Each fact appears ONCE across the entire note.
3. **NO META TALK**: Never say "this video discusses" or "the author mentions" — just present the info directly.
4. **NO FILLER**: Every sentence carries real information. No "this is important" padding.
5. **NO TEXTBOOK VOICE**: No generic "Prerequisites", "Study Strategy" sections unless the source warrants it.
6. **BE THOROUGH**: Explain every concept fully. If a concept has 5 aspects, cover all 5 in detail.
7. **TABLES FOR DATA**: Use markdown tables for ANY structured or comparable data.
8. **EMOJIS FOR HEADERS ONLY**: Emojis on H1, H2, and key point bullets only.
9. **DATA ACCURACY**: Numbers/percentages only if explicitly in the source.
10. **VALID SVG**: Every SVG must be well-formed XML with xmlns attribute.
11. **EXPAND, DON'T SUMMARIZE**: Your job is to make content MORE detailed and accessible, not shorter.
12. **EXAMPLES EVERYWHERE**: Include real-world examples, analogies, and scenarios for every major concept.

## INPUT CONTENT

${trimmedContent}

NOW GENERATE THE NOTES. Make them EXTREMELY detailed, visually stunning, and comprehensive. Remember: minimum 6,000 words, 8-12 sections, 10+ visual elements. A student should be able to study ONLY from these notes and understand everything perfectly.`,
      });

      // Validate AI response
      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      // Generate an AI-powered descriptive title
      const titleResult = await generateText({
        model: this.model,
        providerOptions: this.providerOptions,
        prompt: `TITLE GENERATOR

Create ONE concise, engaging title that accurately represents this content.

Requirements:
- 3-8 words long
- Specific and descriptive (not vague)
- Start with a relevant emoji (📚 🧠 💡 🚀 📊 💰 🎯 🛠️ ⚡ 🔍 📈 🎨 ✅)
- Makes the topic sound interesting

Examples of GOOD titles:
- "📚 Framer Monetization"
- "🧠 Machine Learning Fundamentals"
- "💰 Financial Analysis & Investment Strategies"
- "🚀 Digital Marketing & SEO"

Examples of BAD titles (avoid these):
- "Notes" (too vague)
- "Analysis of document" (generic)
- "Important information" (not specific)

Content to Analyze:
${result.text.substring(0, 1000)}...

Source Document: ${transcript.originalName}

Generate ONE perfect title (no quotes, no extra text, just the title):`,
      });

      const aiGeneratedTitle =
        titleResult.text.trim().replace(/^["'`]|["'`]$/g, "") ||
        `Educational Notes on ${transcript.originalName}`;

      // Ensure title is reasonable length and add timestamp for uniqueness
      const baseTitle =
        aiGeneratedTitle.length > 80
          ? aiGeneratedTitle.substring(0, 77) + "..."
          : aiGeneratedTitle;
      const title = `${baseTitle}`;

      // Save the generated note to database
      const note = await this.saveNote({
        title,
        content: result.text,
        transcriptId,
        userId,
        folderId,
      });

      return note;
    } catch (error) {
      console.error("Error generating AI note:", error);
      throw new Error("Failed to generate AI note");
    }
  }

  /**
   * Generate AI notes with specific focus/style
   */
  async generateFocusedNote(
    transcriptId: string,
    noteType: NoteType = "summary",
    userId?: string,
    folderId?: string,
  ): Promise<GeneratedNoteResult> {
    try {
      const transcript = await prisma.transcript.findUnique({
        where: { id: transcriptId },
        select: {
          id: true,
          originalName: true,
          cleanContent: true,
          content: true,
        },
      });

      if (!transcript) {
        throw new Error("Transcript not found");
      }

      const contentToAnalyze = transcript.cleanContent || transcript.content;

      if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
        throw new Error(
          "No content available in transcript to generate notes from",
        );
      }

      // Different prompts based on note type
      const prompts = {
        summary: `
COMPREHENSIVE EXECUTIVE LEARNING SUMMARY

Create a comprehensive executive summary that serves as a complete learning overview:

EXECUTIVE LEARNING SUMMARY STRUCTURE:
- **Key Insights and Discoveries:** Most important findings and breakthrough concepts (200-300 words)
- **Strategic Implications:** Business impact, decisions enabled, and strategic value (150-200 words)
- **Core Concepts Mastered:** Essential knowledge gained from this material (150-200 words)
- **Actionable Intelligence:** Immediate applications and implementation opportunities (100-150 words)
- **Future Pathways:** Next steps, continued learning, and growth opportunities (100-150 words)

Focus on creating a summary that enables executives to understand both the immediate value and long-term learning implications. Make complex concepts accessible while maintaining depth and accuracy.
  `,

        detailed: `
COMPREHENSIVE EDUCATIONAL MASTERY FRAMEWORK

Provide a comprehensive educational analysis that enables complete mastery of all content:

COMPREHENSIVE MASTERY FRAMEWORK:
- **Learning Foundation:** Historical context, theoretical basis, and prerequisite knowledge (400-500 words)
- **Detailed Concept Exploration:** In-depth analysis of every major topic with step-by-step explanations (500-800 words per major concept)
- **Technical Deep Dives:** Methodologies, processes, and technical implementations explained thoroughly (300-400 words per technical aspect)
- **Practical Application Analysis:** Real-world use cases, examples, and implementation strategies (400-600 words)
- **Integration Framework:** How concepts connect and build upon each other (200-300 words)
- **Mastery Assessment:** Self-check criteria and knowledge verification methods (200-300 words)

Explain everything as if teaching someone who needs to become an expert. Include multiple examples, analogies, and practical applications for each concept.
  `,

        "action-items": `
STRATEGIC ACTION FRAMEWORK AND IMPLEMENTATION GUIDE

Create a comprehensive action-oriented guide that enables immediate implementation and long-term strategy:

STRATEGIC ACTION FRAMEWORK:
- **Immediate Actions (0-30 days):** Specific, implementable steps with clear success criteria and resource requirements (300-400 words)
- **Short-term Strategy (1-6 months):** Tactical initiatives with timelines, dependencies, and measurable outcomes (400-500 words)
- **Long-term Vision (6+ months):** Strategic recommendations with growth pathways and scalability considerations (300-400 words)
- **Resource Requirements:** Personnel, budget, tools, and infrastructure needed for each phase (200-300 words)
- **Risk Mitigation:** Potential challenges and proactive solutions (200-300 words)
- **Success Metrics:** KPIs, measurement frameworks, and evaluation criteria (200-250 words)
- **Implementation Roadmap:** Step-by-step execution plan with checkpoints and decision points (300-400 words)

Focus on creating actionable intelligence that bridges the gap between knowledge and implementation. Include specific tools, methodologies, and best practices.
  `,

        technical: `
COMPREHENSIVE TECHNICAL MASTERY FRAMEWORK

Provide a comprehensive technical analysis that enables deep technical mastery and implementation:
    
TECHNICAL MASTERY FRAMEWORK:
- **Technical Foundation:** Core technologies, architectures, and theoretical principles (400-500 words)
- **Detailed Methodologies:** Step-by-step technical processes with implementation details (500-700 words)
- **Technology Stack Analysis:** Tools, platforms, APIs, and technical requirements with specific recommendations (400-500 words)
- **Architecture and Design Patterns:** System design principles, best practices, and scalability considerations (400-600 words)
- **Implementation Guidelines:** Code examples, configuration details, and technical specifications (500-700 words)
- **Technical Troubleshooting:** Common issues, debugging approaches, and solution strategies (300-400 words)
- **Performance and Optimization:** Efficiency considerations, monitoring, and improvement strategies (300-400 words)
- **Integration and APIs:** Technical connectivity, data flows, and system interactions (300-400 words)
    
Explain technical concepts with sufficient depth for implementation while maintaining clarity. Include specific examples, code snippets where relevant, and practical technical guidance.
  `,

        executive: `
STRATEGIC EXECUTIVE BRIEFING AND DECISION FRAMEWORK

Create a strategic executive briefing that enables informed decision-making and strategic planning:
    
EXECUTIVE DECISION FRAMEWORK:
- **Strategic Overview:** Business context, market implications, and competitive advantages (300-400 words)
- **Financial Impact Analysis:** Cost-benefit analysis, ROI projections, and budget considerations (300-400 words)
- **Risk and Opportunity Assessment:** Strategic risks, market opportunities, and mitigation strategies (300-400 words)
- **Resource Requirements:** Personnel, infrastructure, and investment needs with timeline implications (250-300 words)
- **Competitive Intelligence:** Market positioning, competitive advantages, and differentiation opportunities (300-350 words)
- **Implementation Strategy:** High-level roadmap, key milestones, and success criteria (300-400 words)
- **Stakeholder Impact:** Effects on customers, employees, partners, and other stakeholders (200-300 words)
- **Decision Points:** Critical choices, trade-offs, and strategic alternatives (250-300 words)
    
Focus on strategic insights that enable confident decision-making. Present complex information in executive-friendly format while maintaining analytical rigor and actionable recommendations.
  `,

        tutorial: `
COMPREHENSIVE TUTORIAL MASTERY FRAMEWORK

Create comprehensive tutorial-style educational content that enables complete skill mastery:
    
TUTORIAL MASTERY FRAMEWORK:
- **Learning Journey Introduction:** What you'll master, why it matters, prerequisites, and study strategy (400-600 words)
- **Foundational Knowledge Building:** Historical context, theoretical foundation, and current landscape (500-800 words)
- **Step-by-Step Concept Mastery:** Detailed explanations of each concept with examples and applications (400-600 words per major concept)
- **Practical Application Guide:** Hands-on exercises, real-world scenarios, and implementation strategies (400-600 words)
- **Comprehensive Learning Glossary:** Detailed definitions with context and examples (4-6 sentences per term)
- **Mastery Assessment:** Self-check criteria, knowledge gaps identification, and remediation strategies (300-400 words)
- **Continued Learning Pathway:** Next steps, advanced topics, and specialization options (400-500 words)
    
Write as if teaching someone who needs deep mastery, not just surface understanding. Include multiple examples, clear explanations, and practical applications throughout.
  `,

        research: `
COMPREHENSIVE RESEARCH ANALYSIS FRAMEWORK

Provide comprehensive research analysis that enables evidence-based understanding and decision-making:
    
RESEARCH ANALYSIS FRAMEWORK:
- **Research Context and Methodology:** Study background, research methods, and analytical approach (300-400 words)
- **Key Findings and Evidence:** Primary discoveries with supporting data and statistical significance (500-700 words)
- **Comparative Analysis:** How findings relate to existing research, contradictions, and confirmations (400-500 words)
- **Implications and Applications:** Practical significance, real-world applications, and impact assessment (400-500 words)
- **Limitations and Considerations:** Research constraints, potential biases, and interpretive cautions (300-400 words)
- **Future Research Directions:** Unanswered questions, recommended studies, and research opportunities (300-400 words)
- **Evidence Quality Assessment:** Reliability, validity, and confidence levels of findings (200-300 words)
    
Present research with academic rigor while making findings accessible and actionable. Include critical analysis and practical implications.
  `,

        creative: `
CREATIVE LEARNING TRANSFORMATION FRAMEWORK

Transform content into engaging, creative educational material that inspires and educates:
    
CREATIVE LEARNING FRAMEWORK:
- **Engaging Introduction:** Hook the reader with compelling stories, analogies, or thought experiments (300-400 words)
- **Narrative-Driven Explanations:** Use storytelling to explain complex concepts and make them memorable (400-600 words per major concept)
- **Visual Descriptions:** Paint vivid mental pictures of abstract concepts and processes (300-400 words)
- **Creative Analogies and Metaphors:** Use familiar concepts to explain unfamiliar ones (200-300 words per analogy)
- **Interactive Elements:** Thought experiments, hypothetical scenarios, and engaging questions (300-400 words)
- **Memorable Frameworks:** Create acronyms, mnemonics, and memorable structures for complex information (200-300 words)
- **Inspirational Applications:** Show the exciting possibilities and transformative potential (300-400 words)
    
Make learning enjoyable and memorable while maintaining educational value. Use creativity to enhance understanding, not replace substance.
  `,
      };

      const specificPrompt = prompts[noteType];

      const result = await generateText({
        model: this.model,
        maxOutputTokens: this.maxOutputTokens,
        providerOptions: this.providerOptions,
        prompt: `You are a world-class educational content architect creating EXTREMELY DETAILED, visually stunning study notes.

Note Type: ${noteType.toUpperCase()}
Document: ${transcript.originalName}

${specificPrompt}

## CRITICAL LENGTH & QUALITY REQUIREMENTS
- **Minimum 5,000 words** of actual content
- **8-12 major sections** with 200-500+ words each
- **Every concept** explained thoroughly with examples and analogies
- **EXPAND, don't summarize** — make content MORE detailed and accessible
- If source is short, go deeper: more examples, real-world applications, comparisons, use cases

## FORMATTING & VISUAL RULES (MANDATORY)

### Structure
- \`# [emoji] [Title]\` — descriptive, engaging
- Start with a LARGE hero SVG (concept map/overview, 6-10 nodes)
- \`> [!IMPORTANT]\` executive summary (150-250 words)
- 8-12 emoji-prefixed key highlights (complete sentences)
- 8-12 detailed body sections, each with opening paragraph + depth + at least one visual
- Quick reference summary table
- 8-12 key takeaways with WHY each matters

### Visual Elements (10-15+ total)
- **Tables**: 4-6 tables with 3-6 columns, 4-8 rows for comparisons, features, metrics
- **Inline SVGs**: 3-5 total (including hero). Use \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 H" width="100%">\`
  - Font: sans-serif, 14px/500 titles, 12px/400 labels. Never weight 600+. Min 11px
  - Colors: Purple fill="#EEEDFE" stroke="#534AB7", Teal fill="#E1F5EE" stroke="#0F6E56", Coral fill="#FAECE7" stroke="#993C1D", Blue fill="#E6F1FB" stroke="#185FA5", Amber fill="#FAEEDA" stroke="#854F0B"
  - Rounded rects rx="8" stroke-width="0.5". Text: text-anchor="middle" dominant-baseline="central"
  - NO gradients, shadows, blur, or comments. Transparent background
  - Use DIFFERENT types: concept map, flow diagram, comparison, layers, timeline, cycle
- **Mermaid diagrams**: 3-4 total (\`\`\`mermaid, flowchart TD/LR only, 4-8 nodes, plain English labels — NO quotes, colons, emojis, HTML, special chars. NO subgraphs or style statements)
- **Callouts**: 4-6 total using \`> [!TIP]\`, \`> [!IMPORTANT]\`, \`> [!WARNING]\`, \`> [!NOTE]\`

### Text Formatting
- **Bold** for key terms, *italics* for definitions
- Emojis on H1, H2 headers and key point bullets ONLY
- Detailed bullets (full sentences, not phrases)
- Numbered lists with descriptions for sequential steps
- NEVER 2+ consecutive text-only sections

## HARD RULES
1. SOURCE ONLY — no hallucination
2. NO META TALK — never "this discusses" or "the author mentions"
3. NO FILLER — every sentence carries information
4. NO REPETITION — each fact appears once
5. EXAMPLES EVERYWHERE — real-world examples for every major concept

Content to Transform:
${contentToAnalyze}

NOW GENERATE. Make these notes EXTREMELY detailed, visually stunning, and comprehensive. A student should be able to study ONLY from these notes.`,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      // Generate an AI-powered descriptive title based on note type and content
      const titleResult = await generateText({
        model: this.model,
        providerOptions: this.providerOptions,
        prompt: `FOCUSED NOTE TITLE GENERATOR

Create a perfect title for a ${noteType.toUpperCase()} note based on the content below.

Note Type: ${noteType} 
Source: ${transcript.originalName}

Title Requirements:
- Should reflect the ${noteType} focus (${noteType === "summary" ? "concise overview" : noteType === "detailed" ? "comprehensive analysis" : noteType === "action-items" ? "actionable strategies" : noteType === "technical" ? "technical implementation" : "executive briefing"})
- Be specific and descriptive (3-8 words)
- Start with a relevant emoji (📚 🧠 💡 🚀 📊 💰 🎯 🛠️ ⚡ 🔍 📈 🎨 ✅ 📋)
- Make the content type clear

Content Preview:
${result.text.substring(0, 500)}...

Generate ONE perfect title (no quotes, just the title):`,
      });

      const aiGeneratedTitle =
        titleResult.text.trim().replace(/^["'`]|["'`]$/g, "") ||
        `${noteType.charAt(0).toUpperCase() + noteType.slice(1)} Notes`;
      const title =
        aiGeneratedTitle.length > 80
          ? aiGeneratedTitle.substring(0, 77) + "..."
          : aiGeneratedTitle;

      const note = await this.saveNote({
        title,
        content: result.text,
        transcriptId,
        userId,
        folderId,
      });

      return note;
    } catch (error) {
      console.error("Error generating focused AI note:", error);
      throw new Error("Failed to generate focused AI note");
    }
  }

  /**
   * Save note to database
   */
  async saveNote(data: NoteData) {
    try {
      // Validate required fields
      if (!data.title || !data.content || !data.transcriptId) {
        throw new Error("Title, content, and transcriptId are required");
      }

      const note = await prisma.note.create({
        data: {
          title: data.title,
          content: data.content,
          transcriptId: data.transcriptId,
          userId: data.userId,
          folderId: data.folderId,
        },
      });

      // Index the note content for vector search synchronously
      // This ensures the chatbot will work immediately after note creation
      console.log(`🔄 Starting indexing for note: ${note.id}`);
      console.log(`📊 Note content length: ${note.content.length} characters`);

      // Pre-indexing validation
      if (!note.content || note.content.trim().length === 0) {
        console.error(`❌ Cannot index note ${note.id}: content is empty`);
        console.warn(
          `⚠️ Note ${note.id} created but chatbot will not work (empty content)`,
        );
      } else if (!process.env.OPENAI_API_KEY) {
        console.error(
          `❌ Cannot index note ${note.id}: OPENAI_API_KEY not configured`,
        );
        console.warn(
          `⚠️ Note ${note.id} created but chatbot will not work (missing API key)`,
        );
      } else {
        try {
          await indexNoteContent(note.id, note.content);
          console.log(`✅ Successfully indexed note: ${note.id}`);
        } catch (error) {
          // Enhanced error logging with full details
          console.error(`❌ Error indexing note ${note.id}:`, error);

          if (error instanceof Error) {
            console.error(`❌ Error name: ${error.name}`);
            console.error(`❌ Error message: ${error.message}`);
            console.error(`❌ Error stack: ${error.stack}`);
          } else {
            console.error(`❌ Unknown error type:`, typeof error, error);
          }

          // Don't fail note creation if indexing fails
          // The note is still usable, just chatbot won't work until manual reindex
          console.warn(
            `⚠️ Note ${note.id} created but chatbot may not work until reindexed`,
          );
          console.warn(
            `⚠️ Please check the error logs above for details on why indexing failed`,
          );
        }
      }

      return note;
    } catch (error) {
      console.error("Error saving note to database:", error);
      throw new Error("Failed to save note to database");
    }
  }

  /**
   * Get note by ID
   */
  async getNote(id: string) {
    try {
      return await prisma.note.findUnique({
        where: { id },
        include: {
          transcript: {
            select: {
              id: true,
              originalName: true,
              content: true,
              cleanContent: true,
              metadata: true,
              createdAt: true,
              type: true,
            },
          },
          translations: {
            select: {
              id: true,
              language: true,
              title: true,
              content: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error retrieving note:", error);
      throw new Error("Failed to retrieve note");
    }
  }

  /**
   * Get notes by transcript ID
   */
  async getNotesByTranscript(transcriptId: string) {
    try {
      return await prisma.note.findMany({
        where: { transcriptId },
        orderBy: { createdAt: "desc" },
        include: {
          transcript: {
            select: {
              id: true,
              originalName: true,
              content: true,
              cleanContent: true,
              metadata: true,
              createdAt: true,
              type: true,
            },
          },
          translations: {
            select: {
              id: true,
              language: true,
              title: true,
              content: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error retrieving notes for transcript:", error);
      throw new Error("Failed to retrieve notes for transcript");
    }
  }

  /**
   * Get notes by user ID
   */
  async getNotesByUser(userId: string) {
    try {
      return await prisma.note.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          transcriptId: true,
          userId: true,
          folderId: true,
          createdAt: true,
          updatedAt: true,
          transcript: {
            select: {
              id: true,
              originalName: true,
              content: true,
              cleanContent: true,
              metadata: true,
              createdAt: true,
              type: true,
            },
          },
          translations: {
            select: {
              id: true,
              language: true,
              title: true,
              content: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error retrieving user notes:", error);

      // Check if it's a Prisma error
      if (error && typeof error === "object" && "code" in error) {
        const prismaError = error as { code: string; message: string };

        switch (prismaError.code) {
          case "P2021":
            throw new Error(
              "Database table 'notes' does not exist. Please check your database migration status.",
            );
          case "P2002":
            throw new Error(
              "A unique constraint violation occurred while retrieving notes.",
            );
          case "P1001":
            throw new Error(
              "Database connection failed. Please check your database configuration.",
            );
          case "P2025":
            throw new Error("The requested notes data was not found.");
          default:
            throw new Error(
              `Database error (${prismaError.code}): ${prismaError.message}`,
            );
        }
      }

      // Handle other types of errors
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve user notes: ${error.message}`);
      }

      throw new Error(
        "An unexpected error occurred while retrieving user notes",
      );
    }
  }

  /**
   * Delete note by ID
   * Requirements: 7.4 - Cascade delete associated podcasts
   */
  async deleteNote(id: string) {
    try {
      // Delete the note (this will cascade delete podcasts due to database constraints)
      const deletedNote = await prisma.note.delete({
        where: { id },
      });

      console.log(`Successfully deleted note ${id} and associated podcasts`);
      return deletedNote;
    } catch (error) {
      console.error("Error deleting note:", error);
      throw new Error("Failed to delete note");
    }
  }

  /**
   * Update note by ID
   */
  async updateNote(
    id: string,
    data: Partial<Pick<NoteData, "title" | "content">>,
  ) {
    try {
      return await prisma.note.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error updating note:", error);
      throw new Error("Failed to update note");
    }
  }

  /**
   * Generate AI notes from text content
   */
  async generateNotesFromContent(
    content: string,
    title: string = "Text Note",
  ): Promise<NotesFromContentResult> {
    try {
      if (!content || content.trim().length === 0) {
        throw new Error("Content is required to generate notes");
      }

      const trimmedContent = content.length > 60000
        ? content.substring(0, 60000) + '\n\n[Content truncated for processing]'
        : content;

      const result = await generateText({
        model: this.model,
        maxOutputTokens: this.maxOutputTokens,
        providerOptions: this.providerOptions,
        prompt: `You are a world-class visual note designer and educational content architect. Your mission is to transform raw content into EXTREMELY DETAILED, beautifully designed, and visually stunning study notes. Think of yourself as creating a premium Notion template combined with an infographic — every section should be rich, thorough, and a joy to read.

## YOUR MISSION

Create THE MOST COMPREHENSIVE, visually rich, and information-dense notes possible. These notes should be SO detailed and well-designed that a student could use them as their SOLE study resource. Every concept must be explained thoroughly with examples, analogies, and visual aids. Do NOT summarize — EXPAND and ENRICH.

## CRITICAL LENGTH REQUIREMENT
- **Minimum 6,000 words** of actual content
- **8-12 major sections** minimum
- **Every concept** gets detailed explanation with examples
- **Every section** should have 200-500+ words of written content
- If the source is short, EXPAND with deeper explanations, real-world examples, analogies, use cases, and practical applications
- NEVER be brief. ALWAYS be thorough.

## HARD RULES
1) SOURCE ONLY — no outside knowledge, no hallucination
2) NO META TALK — never say "this video discusses" or "the author mentions"
3) NO FILLER — every sentence carries real information
4) NO REPETITION — each fact appears once
5) DATA ACCURACY — numbers only if explicitly in source
6) VALID SVG — every SVG must be well-formed XML with xmlns attribute
7) EXPAND, DON'T SUMMARIZE — make content MORE detailed, not shorter
8) EXAMPLES EVERYWHERE — real-world examples and analogies for every major concept

## OUTPUT FORMAT

# [emoji] [Title]

Immediately after the title, create a LARGE, detailed hero SVG (concept map or architecture overview):
- \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 H" width="100%">\` (H=200-400)
- Content area: x=40 to x=640. Background: transparent
- Font: sans-serif, 14px/500 for titles, 12px/400 for labels. Min 11px. Never 600/700 weight
- Colors (soft flat fills, 2-3 per SVG):
  Purple: fill="#EEEDFE" stroke="#534AB7" text="#26215C"
  Teal: fill="#E1F5EE" stroke="#0F6E56" text="#04342C"
  Coral: fill="#FAECE7" stroke="#993C1D" text="#4A1B0C"
  Blue: fill="#E6F1FB" stroke="#185FA5" text="#042C53"
  Amber: fill="#FAEEDA" stroke="#854F0B" text="#412402"
  Gray: fill="#F1EFE8" stroke="#5F5E5A" text="#2C2C2A"
- Rounded rects: rx="8", stroke-width="0.5"
- Text: text-anchor="middle" dominant-baseline="central"
- NO gradients, shadows, blur, glow, or comments in SVG
- Types: flow diagram, concept map, comparison layout, layered architecture, timeline, matrix grid, cycle diagram
- 6-10 nodes for hero, 4-8 for section SVGs

> [!IMPORTANT]
> **What you'll learn:** [150-250 word comprehensive overview of all topics covered]

## ✨ Key Highlights
8-12 emoji-prefixed bullets — each a COMPLETE SENTENCE with context, not just a phrase.

## [emoji] [Dynamic Section Title] (8-12 sections)
Each section MUST include:
- **Opening paragraph** (3-5 sentences) introducing the topic
- **Detailed explanation** with multiple paragraphs
- **At least one visual** (table, SVG, Mermaid, or callout)
- **Practical examples** where relevant
- **Key terms in bold**

Mix formats RICHLY:
- **Tables** — use LIBERALLY (4-6 total). 3-6 columns, 4-8 rows for comparisons, features, steps
- **Detailed bullets** with full sentence explanations
- **Numbered lists** with descriptions for each step
- **Mermaid diagrams** (3-4 total) — \`\`\`mermaid, flowchart TD/LR only, 4-8 nodes, plain English labels. NO quotes, colons, emojis, HTML, special chars in labels. NO subgraphs or style statements
- **Inline SVGs** (3-5 total including hero) — different types across sections
- **Callouts** (4-6 total): \`> [!TIP]\`, \`> [!IMPORTANT]\`, \`> [!WARNING]\`, \`> [!NOTE]\`

## 🔗 How It All Connects
SVG or Mermaid showing relationships between all major concepts, plus written explanation.

## 🎯 Practical Applications & Examples
Real-world use cases, scenarios, and worked examples.

## 📋 Quick Reference
Comprehensive summary table with all key terms, definitions, and important values.

## 🔑 Key Takeaways
8-12 detailed bullets with WHY each point matters.

VISUAL RHYTHM: NEVER have 2+ consecutive text-only sections. Aim for 10-15+ visual elements total.

Return ONLY the notes. Make them EXTREMELY detailed, visually stunning, and comprehensive.

SOURCE:
${trimmedContent}`,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      // Generate an AI-powered descriptive title
      const titleResult = await generateText({
        model: this.model,
        providerOptions: this.providerOptions,
        prompt: `TITLE GENERATOR

Create a perfect engaging title for these notes.

Requirements:
- Clearly describe what the content is about
- Be specific and engaging (3-8 words)
- Start with a relevant emoji (📚 🧠 💡 🚀 📊 💰 🎯 🛠️ ⚡ 🔍 📈 🎨 ✅ 📋)
- Make people want to read these notes

Original Title Provided: ${title}
Generated Content Preview:
${result.text.substring(0, 600)}...

Generate ONE perfect title (no quotes, just the title):`,
      });

      const aiGeneratedTitle =
        titleResult.text.trim().replace(/^["'`]|["'`]$/g, "") ||
        title ||
        "Educational Text Notes";
      const finalTitle =
        aiGeneratedTitle.length > 80
          ? aiGeneratedTitle.substring(0, 77) + "..."
          : aiGeneratedTitle;

      return {
        title: finalTitle,
        content: result.text,
      };
    } catch (error) {
      console.error("Error generating notes from content:", error);
      throw new Error("Failed to generate notes from content");
    }
  }
}

// Export a function for use in API routes
export async function generateNotesFromContent(
  content: string,
  title: string = "Text Note",
): Promise<NotesFromContentResult> {
  const noteService = new NoteService();
  return noteService.generateNotesFromContent(content, title);
}
