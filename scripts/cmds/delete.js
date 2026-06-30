"use strict";

const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "delete",
    aliases: ["delcmd", "del"],
    version: "1.0.0",
    author: "Romeo",
    role: 2,
    shortDescription: "Unload and delete a command",
    longDescription: "Unloads a command from memory and permanently deletes its .js file from the server.",
    category: "admin",
    guide: {
      en: "{pn} <command_name>"
    }
  },

  onStart: async ({ api, event, args, message }) => {
    const admin = global.GoatBot.config.adminBot || [];
    if (!admin.includes(global.normUID(event.senderID))) {
      return message.reply("You don't have enough permission to use this command. Only My Author Have Access.");
    }

    const target = args[0]?.toLowerCase();
    if (!target) return message.reply("❌ Usage: !delete <command_name>");

    if (target === "delete" || target === "cmd") {
      return message.reply("❌ You cannot delete core management commands!");
    }

    const filePath = path.join(__dirname, target + ".js");

    if (!fs.existsSync(filePath)) {
      return message.reply(`❌ The command file *${target}.js* does not exist in the cmds folder.`);
    }

    try {
      global.unloadCmd(target);
    } catch (err) {
      // Continue to delete file even if it wasn't currently loaded
      console.log(`[delete.js] Note: Could not unload ${target} (might not be loaded). Message: ${err.message}`);
    }

    try {
      fs.unlinkSync(filePath);
      await message.react("✅");
      return message.reply(`✅ Command *${target}* has been unloaded and its file (${target}.js) deleted permanently.`);
    } catch (err) {
      await message.react("❌");
      return message.reply(`❌ Failed to delete the file *${target}.js*.\nReason: ${err.message}`);
    }
  }
};
