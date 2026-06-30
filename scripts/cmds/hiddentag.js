"use strict";

module.exports = {
  config: {
    name: "hiddentag",
    aliases: ["htag", "taghidden"],
    version: "1.0.0",
    author: "Rômeo",
    role: 1,
    shortDescription: "Tag all members invisibly",
    longDescription: "Sends a message that notifies every member of the group without cluttering the message with @mentions.",
    category: "group",
    guide: { en: "{pn} [text]" }
  },

  onStart: async ({ api, event, args, message }) => {
    try {
      if (!event.isGroup) {
        return message.reply("❌ This command can only be used in groups.");
      }

      const text = args.join(" ");
      if (!text) {
        return message.reply("❌ Please provide the message you want to send.");
      }

      const groupInfo = await api.getGroupInfo(event.threadID);
      if (!groupInfo || !groupInfo.participants) {
        return message.reply("❌ Could not load group member data from WhatsApp.");
      }

      const jidArray = groupInfo.participants.map(m => m.id);

      await api.sendMessage(
        {
          body: text,
          mentions: jidArray
        },
        event.threadID
      );

    } catch (err) {
      return message.reply("❌ Error sending hidden tag: " + err.message);
    }
  }
};
