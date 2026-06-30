"use strict";

const fs = require("fs");
const path = require("path");

const { config } = global.GoatBot;

function normalizePhone(raw) {
  if (!raw) return null;
  return String(raw)
    .replace(/@.*$/, "")
    .replace(/:.*$/, "")
    .replace(/\D/g, "");
}

function resolveTarget(event, args) {
  const mentions = event.mentions;
  if (mentions) {
    const jids = Array.isArray(mentions) ? mentions : Object.keys(mentions);
    if (jids.length > 0) return normalizePhone(jids[0]);
  }
  const replied = event.messageReply || event.replyToMessage;
  if (replied && replied.senderID) return normalizePhone(replied.senderID);
  const num = args.find(a => /^\d{6,}$/.test(a));
  if (num) return normalizePhone(num);
  return null;
}

module.exports = {
  config: {
    name: "owner",
    aliases: ["admin", "adminbot"],
    version: "1.1",
    author: "Rômeo",
    countDown: 3,
    role: 2,
    shortDescription: "Manage bot admins (owners)",
    category: "admin",
    guide: {
      en:
        "   {pn}              — list all admins\n" +
        "   {pn} add @user    — add a new admin\n" +
        "   {pn} remove @user — remove an admin\n" +
        "   {pn} add <number> — add by phone number",
    },
  },

  onStart: async ({ event, args, message, api }) => {
    const admins = config.adminBot || [];
    const senderID = event.senderID;
    const senderPhone = normalizePhone(senderID);

    const superOwner = normalizePhone(admins[0]);
    const isSuperOwner = senderPhone === superOwner;

    const sub = (args[0] || "").toLowerCase();

    if (!sub || sub === "list") {
      if (admins.length === 0) return message.reply("❌ No bot admins configured.");

      let msg = `👑 *BOT ADMINS (${admins.length})*\n${"─".repeat(25)}\n`;
      const mentions = [];
      for (let i = 0; i < admins.length; i++) {
        const id = String(admins[i]);
        const tag = i === 0 ? " 👑 SuperOwner" : "";

        const isLid = /^[12]\d{14}$/.test(id);
        const jid = id + (isLid ? "@lid" : "@s.whatsapp.net");
        mentions.push(jid);

        let name = "Unknown";
        if (global.utils && global.utils.resolveUserDisplayName) {
          name = await global.utils.resolveUserDisplayName(api, jid, global.GoatBot.DB.userData);
        }
        if (!name || name === "Unknown" || name.match(/^\d+$/)) {
          const userData = await global.GoatBot.DB.userData(id);
          name = userData ? userData.name : "Unknown";
        }

        msg += `${i + 1}. @${id} (${id})${tag}\n`;
      }
      msg += `\n${"─".repeat(25)}\n`;
      msg += `📌 *Prefix:* \`${config.prefix || "."}\`\n`;
      msg += `🤖 *Bot Name:* ${config.botName || "Bot"}\n`;
      msg += `🗄️ *DB Type:* ${(config.database && config.database.type) || "json"}`;
      return message.reply({ body: msg, mentions });
    }

    if (!isSuperOwner) {
      return message.reply("❌ Only the *SuperOwner* can add or remove admins.");
    }

    if (sub === "add") {
      const target = resolveTarget(event, args.slice(1));
      if (!target) {
        return message.reply("❌ Please @mention, reply to, or provide a phone number to add.");
      }
      if (admins.includes(target)) {
        return message.reply(`⚠️ *+${target}* is already a bot admin.`);
      }
      admins.push(target);
      config.adminBot = admins;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2), "utf8");
      const targetStr = String(target);
      const isLid = /^[12]\d{14}$/.test(targetStr);
      const targetJid = targetStr + (isLid ? "@lid" : "@s.whatsapp.net");

      let name = "Unknown";
      if (global.utils && global.utils.resolveUserDisplayName) {
        name = await global.utils.resolveUserDisplayName(api, targetJid, global.GoatBot.DB.userData);
      }
      if (!name || name === "Unknown" || name.match(/^\d+$/)) {
        const userData = await global.GoatBot.DB.userData(target);
        name = userData ? userData.name : "Unknown";
      }

      return message.reply({
        body: `✅ *@${target} (${target})* has been added as a bot admin`,
        mentions: [targetJid]
      });
    }

    if (sub === "remove" || sub === "del" || sub === "delete") {
      const target = resolveTarget(event, args.slice(1));
      if (!target) {
        return message.reply("❌ Please @mention, reply to, or provide a phone number to remove.");
      }
      if (target === superOwner) {
        return message.reply("❌ You cannot remove the *SuperOwner* from the admin list.");
      }
      const idx = admins.indexOf(target);
      if (idx === -1) {
        return message.reply(`⚠️ *+${target}* is not in the admin list.`);
      }
      admins.splice(idx, 1);
      config.adminBot = admins;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2), "utf8");

      const targetStr = String(target);
      const isLid = /^[12]\d{14}$/.test(targetStr);
      const targetJid = targetStr + (isLid ? "@lid" : "@s.whatsapp.net");

      let name = "Unknown";
      if (global.utils && global.utils.resolveUserDisplayName) {
        name = await global.utils.resolveUserDisplayName(api, targetJid, global.GoatBot.DB.userData);
      }
      if (!name || name === "Unknown" || name.match(/^\d+$/)) {
        const userData = await global.GoatBot.DB.userData(target);
        name = userData ? userData.name : "Unknown";
      }

      return message.reply({
        body: `✅ *@${target} (${target})* has been removed from bot admins`,
        mentions: [targetJid]
      });
    }

    return message.reply(
      "❓ Unknown action. Usage:\n" +
      "   `.owner`         — list admins\n" +
      "   `.owner add`     — add admin\n" +
      "   `.owner remove`  — remove admin"
    );
  },
};
