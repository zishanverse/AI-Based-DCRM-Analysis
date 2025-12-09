require('dotenv').config();
console.log("ZAI_API_KEY exists:", !!process.env.ZAI_API_KEY);
console.log("ZAI_BASE_URL exists:", !!process.env.ZAI_BASE_URL);
console.log("ZAI_MODEL:", process.env.ZAI_MODEL);
