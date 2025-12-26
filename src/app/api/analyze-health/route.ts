import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { db } from "@/lib/db";

// Initialize ChatOpenAI
const chat = new ChatOpenAI({
  configuration: {
    baseURL: process.env.ZAI_BASE_URL,
    apiKey: process.env.ZAI_API_KEY,
  },
  modelName: process.env.ZAI_MODEL || "glm-4-flash",
  temperature: parseFloat(process.env.ZAI_TEMPERATURE || "0.1"),
  maxTokens: parseInt(process.env.ZAI_MAX_TOKENS || "4096"),
  timeout: parseInt(process.env.ZAI_TIMEOUT_SECONDS || "60") * 1000,
});

export async function POST(request: NextRequest) {
  let jobId: string | null = null;
  const startTime = new Date();

  try {
    const { testResultId, metrics, comparison, shapData } = await request.json();

    if (!metrics) {
      return NextResponse.json(
        { error: "Missing metrics data" },
        { status: 400 }
      );
    }

    // 1. Create Assistant Job
    const job = await db.assistantJob.create({
      data: {
        status: "running",
        message: "Starting AI Analysis",
        csvUrl: "", // Optional: if we knew the CSV URL here
        predictionSummary: "Analyzing metrics...",
        systemPrompt: "Senior DCRM diagnostics assistant",
      },
    });
    jobId = job.id;

    // Construct the prompt
    let systemPrompt = process.env.ZAI_SYSTEM_PROMPT || "You are a senior DCRM diagnostics assistant.";
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
          "score": <0-100 integer>,
          "status": "Healthy" | "Observation Required" | "Critical",
          "reasoning": "<Concise explanation>"
        },
        "mainContacts": {
          "score": <0-100 integer>,
          "status": "Healthy" | "Observation Required" | "Critical",
          "reasoning": "<Concise explanation>"
        },
        "operatingMechanism": {
          "score": <0-100 integer>,
          "status": "Healthy" | "Observation Required" | "Critical",
          "reasoning": "<Concise explanation>"
        },
        "technicalParameters": {
            "mainContactResistance": { "value": <number>, "unit": "μΩ", "status": "Healthy" | "Warning" | "Critical" },
            "arcingContactResistance": { "value": <number>, "unit": "μΩ", "status": "Healthy" | "Warning" | "Critical" },
            "travelOverlap": { "value": <number>, "unit": "mm", "status": "Healthy" | "Warning" | "Critical" },
            "integratedWear": { "value": <number>, "unit": "μΩs", "status": "Healthy" | "Warning" | "Critical" }
        },
        "overallScore": <0-100 integer>,
        "maintenanceRecommendation": "<Short recommendation>",
        "maintenanceSchedule": "Immediate" | "Next Outage" | "Routine" | "Condition Based",
        "maintenancePriority": "Critical" | "High" | "Medium" | "Low",
        "criticalAlert": "<Optional message or null>",
        "differenceAnalysis": "<Summary of differences>",
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

    // 2. Call AI
    const response = await chat.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(prompt),
    ]);

    const content = response.content.toString();
    const jsonString = content.replace(/```json\n?|\n?```/g, "").trim();
    let analysisFull;

    try {
      analysisFull = JSON.parse(jsonString);
    } catch (parseError) {
      console.warn("Initial JSON parse failed, attempting repair:", parseError);
      // Simple repair attempt
      let repairedString = jsonString;
      if (repairedString.lastIndexOf('"') > repairedString.lastIndexOf('}')) {
        repairedString += '"}] }';
      } else {
        repairedString += '] }';
      }
      try {
        analysisFull = JSON.parse(repairedString);
      } catch (repairError) {
        throw parseError;
      }
    }

    // 3. Save SHAP & Prediction Data
    // Ensure Model Metadata exists (Placeholder)
    const modelMeta = await db.mlModelMetadata.upsert({
      where: { id: 1 },
      update: {},
      create: {
        modelName: "DCRM-XGBoost-Ensemble",
        modelType: "xgboost",
        modelVersion: "1.0.0",
        trainingDate: new Date(),
        featureNames: ["resistance", "current", "travel"],
        labelMap: {},
      }
    });

    const prediction = await db.mlPredictionOutput.create({
      data: {
        modelMetadataId: modelMeta.id,
        inputShape: [], // Placeholder
        primaryClassIndex: 0,
        primaryClassLabel: analysisFull.overallScore > 80 ? "Healthy" : "Faulty",
        primaryConfidence: analysisFull.overallScore / 100, // Normalized score as confidence
        secondaryClassLabel: "Unknown",
        rawScores: analysisFull,
      }
    });

    if (shapData) {
      await db.shapExplanation.create({
        data: {
          predictionId: prediction.id,
          baseValue: 0,
          shapValues: [], // Storing complex structure in 'data' field instead
          featureNames: Object.keys(shapData?.shap?.xgboost || {}),
          data: shapData,
        }
      });
    }

    // 4. Update TestResult & AssistantJob
    if (testResultId) {
      await db.testResult.update({
        where: { id: testResultId },
        data: { componentHealth: analysisFull },
      });
    }

    await db.assistantJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        reply: JSON.stringify(analysisFull),
        predictionSummary: analysisFull.maintenanceRecommendation || "Analysis Completed",
      }
    });

    return NextResponse.json({
      success: true,
      data: analysisFull,
    });

  } catch (error) {
    console.error("AI Analysis Error Full:", error);

    // Update Job Status on Error
    if (jobId) {
      await db.assistantJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        }
      });
    }

    return NextResponse.json(
      {
        error: "Failed to generate AI analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
