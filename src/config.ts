import dotenv from "dotenv";

dotenv.config();

const { DISCORD_TOKEN, DISCORD_APPLICATION_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_APPLICATION_ID) {
  throw new Error("Missing environment variables");
}

export const config = {
  DISCORD_TOKEN,
  DISCORD_APPLICATION_ID
};