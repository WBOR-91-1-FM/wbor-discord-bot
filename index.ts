import WBORClient from './src/client';

const client = new WBORClient();
client.login(process.env.DISCORD_BOT_TOKEN);
