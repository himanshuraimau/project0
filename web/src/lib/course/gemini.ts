import { GoogleGenerativeAI } from "@google/generative-ai";
import { jsonrepair } from "jsonrepair";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  model: string = "gemini-2.5-flash",
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
      const modelInstance = genAI.getGenerativeModel({
        model,
        generationConfig: { temperature },
      });

      const response = await modelInstance.generateContent([
        system_prompt + output_format_prompt + error_msg + "\n\n" + user_prompt.toString(),
      ]);

      let res: string = response.response.text();

      // 🔹 Strip code fences if Gemini adds them
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
        console.log("\nGemini raw response:", response.response.text());
        console.log("\nGemini cleaned response:", res);
      }

      let output: unknown;
      try {
        output = JSON.parse(res);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Raw response:", response.response.text());
        console.error("Cleaned response:", res);
        throw new Error(`Failed to parse Gemini response as JSON: ${parseError}`);
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
