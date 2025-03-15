import { WBORClient } from "./src/client";

const client = new WBORClient();
client.login(process.env.BOT_TOKEN);
