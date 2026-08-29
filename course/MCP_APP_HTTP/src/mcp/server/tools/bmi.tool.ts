import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export default function registerBmiTools(mcpServer: McpServer) {
  console.log("Registering Bmi Tools...");

  mcpServer.registerTool(
    "calculate_bmi",
    {
      description: "Calculate Body Mass Index (BMI). Use when user asks to calculate BMI or health weight status based on weight and height.",
      inputSchema: z.object({
        weightKg: z.number().describe("Weight in kilograms"),
        heightMeters: z.number().describe("Height in meters (e.g. 1.75)"),
      }),
    },
    async ({ weightKg, heightMeters }) => {
      const bmi = (weightKg / (heightMeters * heightMeters)).toFixed(2);
      let category = "Normal weight";
      const numericBmi = parseFloat(bmi);
      if (numericBmi < 18.5) category = "Underweight";
      else if (numericBmi >= 25 && numericBmi < 29.9) category = "Overweight";
      else if (numericBmi >= 30) category = "Obesity";

      return {
        content: [{ type: "text", text: `BMI: ${bmi} | Category: ${category}` }],
      };
    },
  );
}
