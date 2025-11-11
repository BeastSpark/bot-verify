import { SlashCommandBuilder } from "discord.js";

export default async function setupBot(client) {
  const guild = client.guilds.cache.first();
  if (!guild) return console.log("❌ Не найден сервер для регистрации команд");

  // Створюємо slash-команду /verify
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("verify")
      .setDescription("Пройти капчу і отримати роль")
  );
  console.log("✅ Slash-команда /verify создана!");
}
