import { Events, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } from "discord.js";
import { Captcha } from "captcha-canvas";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const ROLE_TO_ADD = process.env.ROLE_TO_ADD;
const ROLE_TO_REMOVE = process.env.ROLE_TO_REMOVE;

export default function setupVerify(client) {
  // Обробка команди /verify
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "verify") return;

    // Створюємо капчу
    const captcha = new Captcha();
    captcha.async = true;
    captcha.addDecoy();
    captcha.drawTrace();
    captcha.drawCaptcha();

    const captchaPath = path.join("./captcha.png");
    fs.writeFileSync(captchaPath, await captcha.png);

    const attachment = new AttachmentBuilder(captchaPath);

    // Відправляємо капчу
    await interaction.reply({
      content: `${interaction.user}, введите текст с картинки, чтобы подтвердить, что вы не бот:`,
      files: [attachment],
      ephemeral: true
    });

    const filter = (m) => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });

    collector.on("collect", async (msg) => {
      const userAnswer = msg.content.trim();

      if (userAnswer === captcha.text) {
        // Правильна відповідь — показуємо кнопку
        const button = new ButtonBuilder()
          .setCustomId("finish_verify")
          .setLabel("✅ Завершить капчу")
          .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.followUp({
          content: "✅ Верно! Нажмите кнопку, чтобы получить роль:",
          components: [row],
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: "❌ Неверно! Попробуйте снова командой /verify",
          ephemeral: true
        });
      }

      fs.unlinkSync(captchaPath);
      msg.delete().catch(() => {});
    });

    collector.on("end", (collected) => {
      if (collected.size === 0 && fs.existsSync(captchaPath)) {
        fs.unlinkSync(captchaPath);
        interaction.followUp({ content: "⏰ Время вышло! Попробуйте снова /verify", ephemeral: true });
      }
    });
  });

  // Обробка кнопки завершення капчі
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "finish_verify") return;

    const member = interaction.guild.members.cache.get(interaction.user.id);
    if (!member) return interaction.reply({ content: "⚠️ Пользователь не найден.", ephemeral: true });

    const roleToAdd = interaction.guild.roles.cache.get(ROLE_TO_ADD);
    const roleToRemove = interaction.guild.roles.cache.get(ROLE_TO_REMOVE);

    if (!roleToAdd) return interaction.reply({ content: "⚠️ Роль для выдачи не найдена.", ephemeral: true });

    try {
      if (roleToRemove) await member.roles.remove(roleToRemove); // видаляємо стару роль
      await member.roles.add(roleToAdd); // додаємо нову роль
      await interaction.reply({ content: "🎉 Вы успешно прошли капчу и получили роль!", ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: "⚠️ Не удалось изменить роли. Проверьте права бота.", ephemeral: true });
    }
  });
}
