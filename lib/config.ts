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
