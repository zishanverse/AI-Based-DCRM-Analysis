import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { db } from "@/lib/db";

// Initialize ChatOpenAI with ZAI configuration
const chat = new ChatOpenAI({
  configuration: {
    baseURL: process.env.ZAI_BASE_URL,
    apiKey: process.env.ZAI_API_KEY,
  },
  modelName: process.env.ZAI_MODEL || "glm-4.5",
  temperature: parseFloat(process.env.ZAI_TEMPERATURE || "0.6"),
  maxTokens: parseInt(process.env.ZAI_MAX_TOKENS || "1536"),
  timeout: parseInt(process.env.ZAI_TIMEOUT_SECONDS || "240") * 1000,
});

export async function POST(request: NextRequest) {
  try {
    const { testResultId, metrics, referenceMetrics } = await request.json();

    if (!metrics) {
      return NextResponse.json(
        { error: "Missing metrics data" },
        { status: 400 }
      );
    }

    // Construct the prompt
    const systemPrompt =
      process.env.ZAI_SYSTEM_PROMPT ||
      "You are a senior DCRM diagnostics assistant. Analyze DCRM data and provide accurate diagnostic insights.";

    const prompt = `
      Analyze the following Dynamic Contact Resistance Measurement (DCRM) data for a High Voltage Circuit Breaker.
      
      REFERENECE/IDEAL VALUES (if available):
      ${JSON.stringify(referenceMetrics, null, 2)}

      TEST VALUES (Current Test):
      ${JSON.stringify(metrics, null, 2)}

      Task:
      Evaluate the health of the following 3 components based *strictly* on the provided data.
      1. **Arc Contacts**: Look at Dynamic Resistance variations. High deviations indicate wear.
      2. **Main Contacts**: Look at Static Resistance (Average Resistance). High values indicate looseness or oxidation.
      3. **Operating Mechanism**: Look at Travel curves, Velocity, and Coil timings. Slow or irregular movement indicates mechanical friction or damping issues.

      You MUST return the response in the following strict JSON format ONLY. No markdown, no extra text.
      {
        "arcContacts": {
          "score": <0-100 integer, 100 is perfect>,
          "status": "Healthy" | "Observation Required" | "Critical",
          "reasoning": "<Concise explanation, max 2 sentences>"
        },
        "mainContacts": {
           "score": <0-100 integer>,
           "status": "Healthy" | "Observation Required" | "Critical",
           "reasoning": "<Concise explanation, max 2 sentences>"
        },
        "operatingMechanism": {
           "score": <0-100 integer>,
           "status": "Healthy" | "Observation Required" | "Critical",
           "reasoning": "<Concise explanation, max 2 sentences>"
        },
        "overallScore": <0-100 integer, weighted average>,
        "maintenanceRecommendation": "<One specific actionable recommendation>"
      }
    `;

    // Call AI
    const response = await chat.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(prompt),
    ]);

    // Parse JSON
    const content = response.content.toString();
    // Clean markdown code blocks if present
    const jsonString = content.replace(/```json\n?|\n?```/g, "").trim();
    const analysisFull = JSON.parse(jsonString);

    // Update DB if testResultId is provided
    if (testResultId) {
      await db.testResult.update({
        where: { id: testResultId },
        data: {
          componentHealth: analysisFull,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: analysisFull,
    });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate AI analysis",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
