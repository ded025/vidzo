import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = process.env.OPENAI_MODEL?.trim() || "gpt-5.5";

if (!apiKey || apiKey === "your-openai-api-key") {
  console.error("OPENAI_API_KEY is not configured.");
  process.exit(1);
}

const client = new OpenAI({ apiKey });
const response = await client.responses.create({
  model,
  input: "Reply with exactly: VIDZO_OPENAI_OK",
  max_output_tokens: 32,
});

if (response.output_text.trim() !== "VIDZO_OPENAI_OK") {
  console.error(`OpenAI responded, but the smoke-check output was unexpected for ${model}.`);
  process.exit(1);
}

console.log(`OpenAI smoke check passed using ${model}.`);
