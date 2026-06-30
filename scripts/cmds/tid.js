"use strict";

module.exports = {
  config: {
    name: "tid",
    version: "1.0.0",
    author: "Rômeo",
    countDown: 5,
    role: 0,
    shortDescription: "Get the current thread/group ID",
    longDescription: "Returns the JID (Thread ID) of the current chat or group.",
    category: "info",
    guide: { en: "{pn}" }
  },

  onStart: async ({ event, message }) => {
    let text = `📋 *Thread Info*\n`;
    text += `Thread ID: ${event.threadID}\n`;
    text += `Type: ${event.isGroup ? "Group" : "DM"}`;

    if (event.isGroup && global.db) {
      try {
        const thread = await global.db.threadsData.get(event.threadID);
        const name = thread?.threadName || thread?.name;
        if (name) text += `\nName: ${name}`;
        const count = thread?.members?.length || thread?.totalMember;
        if (count) text += `\nMembers: ${count}`;
      } catch (_) { }
    }

    return message.reply(text);
  }
};
