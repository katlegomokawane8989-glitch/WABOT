"use strict";

module.exports = {
  config: {
    name: "join",
    version: "1.0.0",
    author: "Rômeo",
    countDown: 5,
    role: 2,
    shortDescription: "Join a group via invite link",
    longDescription: "Joins a WhatsApp group using the provided group invite link. Only Bot Admins can use this.",
    category: "admin",
    guide: { en: "{pn} [invite link]" }
  },

  onStart: async function ({ api, event, args, message }) {
    if (!args[0]) return message.reply("❌ Please provide a group invite link.\nExample: !join https://chat.whatsapp.com/XXXXXX");

    const link = args[0].trim();
    const match = link.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/);
    if (!match) return message.reply("❌ Invalid invite link. Please provide a valid WhatsApp group invite link.");

    const code = match[1];

    try {
      const result = await api.groupAcceptInvite(code);
      const gid = typeof result === "object" ? result.id : result;
      const groupJid = typeof gid === "string" && gid.includes("@g.us") ? gid : gid + "@g.us";

      message.reply(`✅ Successfully joined the group!\nGroup ID: ${gid}`);

      try {
        const info = await api.getGroupInfo(groupJid);
        const groupName = info.subject || info.name || "this group";
        const cfg = global.GoatBot.config;
        const prefix = cfg.prefix || "!";
        const botName = cfg.botName || "WCA Bot";
        await api.sendMessage(
          {
            body: `👋 Hello everyone! I'm *${botName}*, your new assistant bot.\nThank you for adding me to *${groupName}* 🎉\n\nType *${prefix}help* to see all available commands.`,
          },
          groupJid
        );
      } catch (_) { }
    } catch (e) {
      if (e.message?.includes("409")) {
        return message.reply("❌ Already a member of this group.");
      }
      return message.reply("❌ Failed to join group: " + e.message);
    }
  }
};
