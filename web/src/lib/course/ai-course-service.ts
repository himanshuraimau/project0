import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { jsonrepair } from "jsonrepair";

// Initialize the AI SDK model
const model = openai("gpt-4o");

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat | OutputFormat[] | Record<string, any>;
}

/**
 * Generate structured output from AI using AI SDK
 * This replaces the Gemini-specific implementation with AI SDK
 */
export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false
) {
  const list_input: boolean = Array.isArray(user_prompt);
  const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
  const list_output: boolean = /\[.*?\]/.test(JSON.stringify(output_format));

  let error_msg: string = "";

  for (let i = 0; i < num_tries; i++) {
    let output_format_prompt: string = `\nYou are to output ${
      list_output ? "an array of objects in" : ""
    } the following in JSON format: ${JSON.stringify(
      output_format
    )}. \nDo not include markdown code fences (\`\`\`), only raw JSON.`;

    if (list_output) {
      output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
    }

    if (dynamic_elements) {
      output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it.`;
    }

    if (list_input) {
      output_format_prompt += `\nGenerate an array of JSON, one JSON for each input element.`;
    }

    try {
      // Use AI SDK's generateText instead of Gemini's direct API
      const result = await generateText({
        model,
        prompt: system_prompt + output_format_prompt + error_msg + "\n\n" + (Array.isArray(user_prompt) ? user_prompt.join("\n") : user_prompt),
        temperature,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      let res: string = result.text;

      // 🔹 Strip code fences if model adds them
      res = res.replace(/```json|```/g, "").trim();

      // 🔹 Clean up the response for better JSON parsing
      // First, protect mathematical expressions like f'(x) by temporarily replacing them
      res = res.replace(/f'(\([^)]*\))/g, 'f_prime$1');
      res = res.replace(/f''(\([^)]*\))/g, 'f_double_prime$1');
      
      // Normalize single to double quotes (but be careful with apostrophes in text)
      res = res.replace(/'/g, '"');
      
      // Restore mathematical expressions
      res = res.replace(/f_prime(\([^)]*\))/g, "f'$1");
      res = res.replace(/f_double_prime(\([^)]*\))/g, "f''$1");
      
      res = res.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
      res = res.replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Quote unquoted keys
      res = res.replace(/:\s*([^",{\[\]}\s]+)([,}\]])/g, ': "$1"$2'); // Quote unquoted string values
      res = res.replace(/:\s*"(\d+\.?\d*)"([,}\]])/g, ': $1$2'); // Unquote numbers
      res = res.replace(/:\s*"(true|false|null)"([,}\]])/g, ': $1$2'); // Unquote booleans/null

      // 🔹 Attempt to repair malformed JSON
      try {
        res = jsonrepair(res);
      } catch (repairErr) {
        if (verbose) {
          console.log("jsonrepair failed:", repairErr);
        }
      }

      if (verbose) {
        console.log("System+Output Prompt:", system_prompt + output_format_prompt + error_msg);
        console.log("\nUser prompt:", user_prompt);
        console.log("\nAI SDK raw response:", result.text);
        console.log("\nAI SDK cleaned response:", res);
      }

      let output: unknown;
      try {
        output = JSON.parse(res);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Raw response:", result.text);
        console.error("Cleaned response:", res);
        throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
      }
      
      let outputArray: unknown[];

      if (list_input) {
        if (!Array.isArray(output)) {
          throw new Error("Output format not in an array of JSON");
        }
        outputArray = output;
      } else {
        outputArray = [output];
      }

      for (let index = 0; index < outputArray.length; index++) {
        for (const key in output_format) {
          if (/<.*?>/.test(key)) continue;

          if (!(key in (outputArray[index] as Record<string, unknown>))) {
            throw new Error(`${key} not in json output`);
          }

          if (Array.isArray(output_format[key])) {
            const choices = output_format[key] as string[];
            const currentItem = outputArray[index] as Record<string, unknown>;
            if (Array.isArray(currentItem[key])) {
              currentItem[key] = (currentItem[key] as unknown[])[0];
            }
            if (!choices.includes(currentItem[key] as string) && default_category) {
              currentItem[key] = default_category;
            }
            if (typeof currentItem[key] === "string" && (currentItem[key] as string).includes(":")) {
              currentItem[key] = (currentItem[key] as string).split(":")[0];
            }
          }
        }

        if (output_value_only) {
          const currentItem = outputArray[index] as Record<string, unknown>;
          const values = Object.values(currentItem);
          outputArray[index] = values.length === 1 ? values[0] : values;
        }
      }

      return list_input ? outputArray : outputArray[0];
    } catch (e) {
      error_msg = `\n\nResult parse failed\nError message: ${e}`;
      console.log("An exception occurred:", e);
    }
  }

  return [];
}

/**
 * Course service class that provides methods for course-related AI operations
 * Similar pattern to the NoteService class
 */
export class CourseService {
  private model = openai("gpt-4o");

  /**
   * Generate course chapters based on a title and description
   */
  async generateCourseChapters(title: string, description: string) {
    try {
      if (!title || !description) {
        throw new Error("Title and description are required");
      }

      const analysisId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();

      const result = await strict_output(
        `You are a course creation expert. Your task is to create a detailed course outline.
        Analysis ID: ${analysisId}
        Timestamp: ${timestamp}
        `,
        `Create a comprehensive course outline for: "${title}"
        Course description: "${description}"
        `,
        {
          chapters: [
            {
              title: "Chapter title",
              description: "Chapter description (3-5 sentences)",
              objectives: ["Learning objective 1", "Learning objective 2", "Learning objective 3"]
            }
          ]
        },
        "",
        false,
        0.7,
        3,
        false
      );

      return result;
    } catch (error) {
      console.error("Error generating course chapters:", error);
      throw new Error("Failed to generate course chapters");
    }
  }

  /**
   * Generate chapter details based on chapter title and description
   */
  async generateChapterDetails(chapterTitle: string, chapterDescription: string) {
    try {
      if (!chapterTitle || !chapterDescription) {
        throw new Error("Chapter title and description are required");
      }

      const analysisId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();

      const result = await strict_output(
        `You are a course content expert. Your task is to create detailed content for a course chapter.
        Analysis ID: ${analysisId}
        Timestamp: ${timestamp}
        `,
        `Create detailed content for the chapter: "${chapterTitle}"
        Chapter description: "${chapterDescription}"
        `,
        {
          sections: [
            {
              title: "Section title",
              content: "Detailed section content (at least 300 words)",
              quiz: [
                {
                  question: "Quiz question",
                  options: ["Option 1", "Option 2", "Option 3", "Option 4"],
                  answer: "Correct option"
                }
              ]
            }
          ]
        },
        "",
        false,
        0.7,
        3,
        false
      );

      return result;
    } catch (error) {
      console.error("Error generating chapter details:", error);
      throw new Error("Failed to generate chapter details");
    }
  }

  /**
   * Generate quiz questions for a specific topic
   */
  async generateQuizQuestions(topic: string, numberOfQuestions: number = 5) {
    try {
      if (!topic) {
        throw new Error("Topic is required");
      }

      const analysisId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();

      const result = await strict_output(
        `You are an educational assessment expert. Your task is to create challenging quiz questions.
        Analysis ID: ${analysisId}
        Timestamp: ${timestamp}
        `,
        `Create ${numberOfQuestions} quiz questions for the topic: "${topic}"
        Make sure the questions test understanding rather than just recall.
        `,
        {
          questions: [
            {
              question: "Quiz question",
              options: ["Option 1", "Option 2", "Option 3", "Option 4"],
              answer: "Correct option",
              explanation: "Explanation of why this is the correct answer"
            }
          ]
        },
        "",
        false,
        0.7,
        3,
        false
      );

      return result;
    } catch (error) {
      console.error("Error generating quiz questions:", error);
      throw new Error("Failed to generate quiz questions");
    }
  }
}

// Export a function for use in API routes
export async function generateCourseChapters(
  title: string,
  description: string
) {
  const courseService = new CourseService();
  return courseService.generateCourseChapters(title, description);
}
