import { Storage } from "@google-cloud/storage";
import fs from "fs";

const envPath = "C:/Users/gsury/personal/pb/pneumo_guide/.env.local";
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8").split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const storage = new Storage({ credentials: JSON.parse(env.GOOGLE_CREDENTIALS) });
const bucket = storage.bucket(env.GCS_BUCKET || "typhighter-uploads");

await bucket.setCorsConfiguration([
  {
    origin: ["https://pneumo-guide-gules.vercel.app", "http://localhost:3000"],
    method: ["PUT", "GET", "HEAD"],
    responseHeader: ["Content-Type"],
    maxAgeSeconds: 3600,
  },
]);

const [meta] = await bucket.getMetadata();
console.log("CORS now set to:", JSON.stringify(meta.cors, null, 2));
