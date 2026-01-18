import dotenv from "dotenv";
import path from "path";
import { RoomServiceClient } from "livekit-server-sdk";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function envOrThrow(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in agent/.env`);
  return v;
}

async function main() {
  const roomName = process.argv[2] || "admitx-voice";

  const wsUrl = envOrThrow("LIVEKIT_URL"); // wss://...
  const apiKey = envOrThrow("LIVEKIT_API_KEY");
  const apiSecret = envOrThrow("LIVEKIT_API_SECRET");

  // RoomServiceClient needs HTTP(S), not WS(S)
  const httpUrl = wsUrl.startsWith("wss://")
    ? wsUrl.replace("wss://", "https://")
    : wsUrl.startsWith("ws://")
    ? wsUrl.replace("ws://", "http://")
    : wsUrl;

  const client = new RoomServiceClient(httpUrl, apiKey, apiSecret);

  console.log("✅ Agent starting");
  console.log("Room:", roomName);
  console.log("HTTP:", httpUrl);

  // Ensure room exists / list participants
  const rooms = await client.listRooms();
  const exists = rooms.some((r) => r.name === roomName);

  console.log(exists ? "✅ Room exists" : "⚠️ Room not created yet (will exist once someone joins)");

  const participants = await client.listParticipants(roomName).catch(() => []);
  console.log("Participants:", participants.map((p) => p.identity));

  console.log("✅ Done. (This agent currently just verifies room + participants.)");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
