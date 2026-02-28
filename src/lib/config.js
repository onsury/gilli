// src/lib/config.js
const config = {
  meta: {
    verifyToken: process.env.META_VERIFY_TOKEN || "gilli-verify-2026",
    accessToken: process.env.META_ACCESS_TOKEN || "",
    phoneNumberId: process.env.META_PHONE_NUMBER_ID || "",
    apiVersion: "v21.0",
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
  },
};
export default config;