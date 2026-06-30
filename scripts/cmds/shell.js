"use strict";
const { exec } = require('child_process');

module.exports = {
  config: {
    name: "shell",
    aliases: ["sh"],
    version: "1.0.0",
    author: "Rômeo",
    role: 2,
    shortDescription: "Execute shell commands",
    category: "admin",
    guide: {
      en: "{pn} <command>"
    }
  },

  onStart: async function ({ api, event, args, message }) {

    const command = args.join(" ");
    if (!command) {
      return message.reply("Please provide a command to execute.");
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return message.reply(`An error occurred while executing the command:\n${error.message}`);
      }
      if (stderr) {
        return message.reply(`Command execution resulted in an error:\n${stderr}`);
      }
      message.reply(`Command executed successfully:\n${stdout}`);
    });
  }
};
