import { TrueForge } from "@truefoundry/trueforge-sdk";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TRUEFORGE_BASE_URL = process.env.TRUEFORGE_BASE_URL || "http://localhost:8790";

async function main() {
  const client = new TrueForge({ baseUrl: TRUEFORGE_BASE_URL });

  const specPath = join(__dirname, "agent-spec.json");
  const manifest = JSON.parse(readFileSync(specPath, "utf-8"));

  // Create or update the agent
  const agentName = "incident-responder";

  try {
    const { data: existing } = await client.agents.list();
    const found = existing?.find((a: any) => a.name === agentName);

    if (found) {
      await client.agents.update(found.id, { manifest });
      console.log(`Updated agent '${agentName}' (id: ${found.id})`);
    } else {
      const { data: agent } = await client.agents.create({ name: agentName, manifest });
      console.log(`Created agent '${agentName}' (id: ${agent.id})`);
    }
  } catch (err: any) {
    // If create fails with 409, agent already exists - try to update
    if (err.status === 409) {
      console.log(`Agent '${agentName}' already exists. Use TrueForge UI to update.`);
    } else {
      throw err;
    }
  }

  console.log("\nAgent configured. Open TrueForge UI at:", TRUEFORGE_BASE_URL);
  console.log("Select the 'incident-responder' agent and send: \"There's an incident affecting checkout. Investigate and fix it.\"");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
