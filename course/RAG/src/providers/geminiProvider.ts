import { GoogleGenAI } from "@google/genai";

class GeminiProvider {
  readonly #model: string;
  readonly #ai: GoogleGenAI;

  constructor(apiKey?: string, model?: string) {
    const resolvedKey = apiKey ?? process.env.GEMINI_API_KEY;
    const resolvedModel = model ?? process.env.GEMINI_MODEL;

    if (!resolvedKey) throw new Error("GEMINI_API_KEY is not set in environment variables.");
    if (!resolvedModel) throw new Error("GEMINI_MODEL is not set in environment variables.");

    this.#model = resolvedModel;
    this.#ai = new GoogleGenAI({ apiKey: resolvedKey });
  }

  // Generate a response from the Gemini API based on the provided prompt
  async generateResponse(prompt: string): Promise<string> {
    try {
      const interaction = await this.#ai.interactions.create({
        model: this.#model,
        input: prompt,
      });

      const text =  interaction.output_text;

      if (!text) {
        throw new Error("Empty response received from Gemini API.");
      }

      return text;
    } catch (error) {
      console.error("Error generating response from Gemini API:", error);
      throw new Error(`Error generating response from Gemini API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Generate an embedding for the given text
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.#ai.models.embedContent({
        model: "gemini-embedding-2",
        contents: text,
      });

      const values = response.embeddings?.[0]?.values ?? (response as any).embedding?.values ?? null;

      if (!values || !Array.isArray(values)) {
        throw new Error(`Unrecognized embedding structure: ${JSON.stringify(response)}`);
      }

      return values as number[];
    } catch (error) {
      console.error("Error generating embedding from Gemini API:", error);
      throw new Error(`Error generating embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default GeminiProvider;
