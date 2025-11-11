import { Client, GatewayIntentBits, Partials, Events } from "discord.js";
import dotenv from "dotenv";
import setupBot from "./bot.js";
import setupVerify from "./verify.js";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// Коли бот готовий
client.once(Events.ClientReady, async () => {
  console.log(`✅ Бот запущен как ${client.user.tag}`);
  await setupBot(client); // Реєстрація slash-команд
});

setupVerify(client); // Підключення verify.js

client.login(process.env.TOKEN);
