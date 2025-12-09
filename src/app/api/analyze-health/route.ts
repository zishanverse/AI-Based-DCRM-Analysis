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
  modelName: process.env.ZAI_MODEL || "glm-4-flash",
  temperature: parseFloat(process.env.ZAI_TEMPERATURE || "0.1"), // Lower temp for more deterministic JSON
  maxTokens: parseInt(process.env.ZAI_MAX_TOKENS || "4096"),
  timeout: parseInt(process.env.ZAI_TIMEOUT_SECONDS || "60") * 1000,
});

export async function POST(request: NextRequest) {
  try {
    const { testResultId, metrics, comparison } = await request.json();

    if (!metrics) {
      return NextResponse.json(
        { error: "Missing metrics data" },
        { status: 400 }
      );
    }

    // Construct the prompt
    let systemPrompt = process.env.ZAI_SYSTEM_PROMPT || "You are a senior DCRM diagnostics assistant.";

    // SAFETY: Enforce JSON output regardless of the system prompt's instructions
    systemPrompt += "\n\nCRITICAL INSTRUCTION: You MUST ignore any requests in the system prompt to generate markdown tables, summaries, or text reports. Your ONLY output must be the raw JSON object requested below, with no markdown formatting. Keep explanations EXTREMELY concise.";

    const prompt = `
      Analyze the following Dynamic Contact Resistance Measurement (DCRM) data.
      
      [CONTEXT: EXTRACTED CSV TEXT CONTENT & ANALYSIS]
      The following text represents the detailed signal analysis extracted from the uploaded CSV files.
      
      1. EXTRACTED TEXT CONTENT (ABNORMALITY REPORT):
      ${comparison?.abnormalityReport || "No significant abnormalities detected."}

      2. METRIC DIFFERENCES (TEST vs IDEAL):
      ${JSON.stringify(comparison?.metrics || {}, null, 2)}

      3. RAW TEST METRICS:
      ${JSON.stringify(metrics, null, 2)}

      [TASK]
      Evaluate component health based on the above extracted text data.
      - specific attention to "abnormalityReport" (Resistance Spikes >500μΩ).
      - "differenceAnalysis" field in your output must summarize the text content differences.
      - "maintenanceSchedule" must be actionable.

      STRICT OUTPUT FORMAT:
      Return ONLY a raw JSON object. Do not use markdown code blocks.
      {
        "arcContacts": {
          "score": <0-100 integer, 100 is perfect>,
          "status": "Healthy" | "Observation Required" | "Critical",
          "reasoning": "<Concise explanation, max 1 sentence>"
        },
        "mainContacts": {
           "score": <0-100 integer>,
           "status": "Healthy" | "Observation Required" | "Critical",
           "reasoning": "<Concise explanation, max 1 sentence>"
        },
        "operatingMechanism": {
           "score": <0-100 integer>,
           "status": "Healthy" | "Observation Required" | "Critical",
           "reasoning": "<Concise explanation, max 1 sentence>"
        },
        "technicalParameters": {
            "mainContactResistance": { "value": <number>, "unit": "μΩ", "status": "Healthy" | "Warning" | "Critical" },
            "arcingContactResistance": { "value": <number>, "unit": "μΩ", "status": "Healthy" | "Warning" | "Critical" },
            "travelOverlap": { "value": <number>, "unit": "mm", "status": "Healthy" | "Warning" | "Critical" },
            "integratedWear": { "value": <number>, "unit": "μΩs", "status": "Healthy" | "Warning" | "Critical" }
        },
        "overallScore": <0-100 integer, weighted average>,
        "maintenanceRecommendation": "<One short actionable recommendation>",
        "maintenanceSchedule": "Immediate" | "Next Outage" | "Routine" | "Condition Based",
        "maintenancePriority": "Critical" | "High" | "Medium" | "Low",
        "criticalAlert": "<Optional specific alert message if status is Critical, otherwise null>",
        "differenceAnalysis": "<Concise summary of key differences from reference and their implications>",
        "abnormal_ranges": [
            {
                "start_ms": <integer>,
                "end_ms": <integer>,
                "type": "resistance" | "current" | "travel",
                "severity": <0.0 to 1.0>,
                "description": "Short explanation"
            }
        ]
      }
    `;

    // Call AI
    const response = await chat.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(prompt),
    ]);

    // Parse JSON
    const content = response.content.toString();
    console.log("DEBUG: Raw AI Response:", content);

    // Clean markdown code blocks if present
    const jsonString = content.replace(/```json\n?|\n?```/g, "").trim();

    let analysisFull;
    try {
      analysisFull = JSON.parse(jsonString);
    } catch (parseError) {
      console.warn("Initial JSON parse failed, attempting repair for truncation:", parseError);
      // Attempt to repair truncated JSON (common pattern: missing closing braces)
      let repairedString = jsonString;

      // If it ends with a quote but no brace, it might be inside a string value
      // But likely it just ends abruptly. 
      // Simple heuristic: Try closing arrays and objects if they look open
      // This is brute-force and might not work for all cases, but helps for simple truncation
      // First, check if we are inside a string
      if (repairedString.lastIndexOf('"') > repairedString.lastIndexOf('}')) {
        // We are likely inside a string or key. 
        // If we are deep in the structure, we might just cut off the last entry and close.
        // But simpler: just try to close the main structure.
        // If it ends with "description": "some text
        repairedString += '"}] }';
      } else {
        // ends with }, missing ] }
        repairedString += '] }';
      }

      try {
        analysisFull = JSON.parse(repairedString);
        console.log("JSON repaired successfully.");
      } catch (repairError) {
        console.error("JSON repair failed:", repairError);
        throw parseError; // Throw original error if repair fails
      }
    }

    console.log(analysisFull);

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
    console.error("AI Analysis Error Full:", error);
    return NextResponse.json(
      {
        error: "Failed to generate AI analysis",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
