export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

export function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function optionalEnv(name: string) {
  return process.env[name] || undefined;
}

export function assertLiveResearchConfig() {
  if (isDemoMode()) return;

  const required = ["NIMBLE_API_KEY", "OPENAI_API_KEY"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(
      `Live research setup required. Add ${missing.join(" and ")} to your local .env file.`
    );
  }
}
