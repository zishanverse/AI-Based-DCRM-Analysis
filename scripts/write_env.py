
import os

env_content = r"""AWS_ACCESS_KEY_ID=demo-access-key
AWS_SECRET_ACCESS_KEY=demo-secret-key
AWS_S3_BUCKET_NAME=demo-dcrm-bucket
AWS_REGION=ap-south-1

CLOUDINARY_CLOUD_NAME=deepcnbrz
CLOUDINARY_API_KEY=967268689489882
CLOUDINARY_API_SECRET=-24T1xOP9zSayYEbpXDsm3ZdC4M
CLOUDINARY_UPLOAD_FOLDER=dcrm/csv

DATABASE_URL=postgresql://postgres:oSvnhy0VwoPhKZg8@db.cxmpsvvkqmppbvokvpqu.supabase.co:5432/postgres

DCRM_PASSWORD=oSvnhy0VwoPhKZg8

SUPABASE_URL=https://cxmpsvvkqmppbvokvpqu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bXBzdnZrcW1wcGJ2b2t2cHF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU5NDc2OCwiZXhwIjoyMDgwMTcwNzY4fQ.arrXFv9HLRj_OxGWn-W7TCfPX_ndDDohI5TFsGB9hu0
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bXBzdnZrcW1wcGJ2b2t2cHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTQ3NjgsImV4cCI6MjA4MDE3MDc2OH0.7UV4Zf4f7jTM8y4cVzB_6rmS6_fBXbghlDr3PkozvoI
SUPABASE_HEATMAP_TABLE=heatmap_points
ADVANCED_MODEL_DIR="new models"

ZAI_BASE_URL=https://api.z.ai/api/paas/v4
ZAI_API_KEY=3f4292e2e89a49fd98bde1bedd5b23d4.Yhy7ixeVChxH4kak
ZAI_MODEL=glm-4.5
ZAI_TEMPERATURE=0.6
ZAI_TIMEOUT_SECONDS=500
ZAI_MAX_TOKENS=4096

UPSTASH_REDIS_REST_URL="https://inspired-stag-24600.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AWAYAAIncDI2NmI0M2JiOWIyN2M0ODk5YTVmYmNmNWUyMDU0Y2U3Y3AyMjQ2MDA"
"""

# The massive prompt from user
prompt_text = (
    "You are a specialized AI assistant for Dynamic Contact Resistance Measurement (DCRM) analysis of circuit breakers. "
    "You are an expert in electrical engineering, specifically in circuit breaker diagnostics and maintenance. "
    "Your role is to analyze DCRM test data, compare it with reference data, and provide clear, actionable insights about circuit breaker health. "
    "Core capabilities: analyze DCRM waveform data from CSV files containing resistance, travel, and current measurements; "
    "compare new test data with reference/ideal data to identify degradation; assess health of main contacts, arcing contacts, and operating mechanisms; "
    "provide simple health assessments (Healthy/Needs Attention/Critical); generate maintenance recommendations based on identified issues; "
    "explain technical findings in simple language. Data processing instructions: extract resistance values (CH1-CH6), handle invalid 8000 μΩ values, "
    "extract travel measurements (T1-T6), calculate travel distance and velocity, identify separation timing, extract coil current (C1-C6), "
    "analyze operating patterns, extract open/close velocity, calculate metrics and compare to reference. "
    "For multi-breaker data: identify breaker groups, process each independently, compare performance, generate separate health assessments, identify critical breakers. "
    "Analysis framework: for each breaker analyze main contact resistance (Rp_avg) compared to 50-100 μΩ typical range; "
    "arcing contact resistance (Ra_avg) and peak values; contact timing/travel (T_overlap) and total distance; "
    "integrated wear indicator (Ra_ta) as area under arcing resistance curve; mechanism health via velocity and current; "
    "generate per-breaker health indices and recommendations. "
    "Research-based guidelines: main contact resistance Rp_avg < 100 μΩ = healthy, 100–150 = needs attention, ≥150 = critical; "
    "arcing resistance Ra_avg close to reference = healthy, 20–50% higher = needs attention, >50% higher = critical; "
    "T_overlap within 5% = healthy, 5–15% less = needs attention, >15% less = critical; Ra_ta within 10% = healthy, 10–25% higher = needs attention, >25% higher = critical. "
    "Overall health index weighting: Ra_ta 30%, T_overlap 25%, Ra_avg 20%, Rp_avg 15%, velocity consistency 10%; HI > 85% = healthy, 50–85% = caution, <50% = risky. "
    "Emphasize safety and qualified personnel."
)

# Append escaped format
env_content += f'\nZAI_SYSTEM_PROMPT="{prompt_text}"'

with open('.env', 'w', encoding='utf-8') as f:
    f.write(env_content)

print("Environment file .env created successfully with extended prompt.")
