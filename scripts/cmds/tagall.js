"use strict";

module.exports = {
    config: {
        name: "tagall",
        aliases: ["everyone", "all", "mention"],
        version: "1.0.0",
        author: "Rôméo",
        role: 1,
        countDown: 10,
        shortDescription: "Tag all members in the group",
        longDescription: "Tags every member of the group in a single message.",
        category: "group",
        guide: { en: "{pn} [message]" }
    },

    onStart: async ({ api, event, args, message, threadsData }) => {
        try {
            if (!event.isGroup) {
                return message.reply(
                    '╭────❒ ❌ Error ❒\n' +
                    '├⬡ This command can only be used in groups\n' +
                    '╰────────────❒'
                );
            }

            let thread;
            if (typeof threadsData === 'function') {
                thread = await threadsData(event.threadID);
            } else {
                thread = await threadsData.get(event.threadID);
            }

            const membersList = thread.members || thread.allMembers;
            if (!thread || !membersList) {
                return message.reply("❌ Could not load group member data.");
            }

            const activeMembers = membersList.filter(m => m.inGroup !== false);
            const jidArray = activeMembers.map(m => m.userID || m.uid);

            const msgText = args.join(' ') || "Hello everyone it's WAGoat-Bot";

            let mentionText = `╭────❒ 📢 Announcement ❒\n`;
            mentionText += `├⬡ *${msgText}*\n`;
            mentionText += `╰────────────❒\n\n`;

            for (let member of activeMembers) {
                const uid = member.userID || member.uid;
                mentionText += `@${uid.split('@')[0]}\n`;
            }

            await api.sendMessage(
                {
                    body: mentionText,
                    mentions: jidArray
                },
                event.threadID
            );

        } catch (err) {
            console.error('TagAll error:', err);
            await message.reply(
                '╭────❒ ❌ Error ❒\n' +
                '├⬡ Failed to tag members\n' +
                '├⬡ Please try again later\n' +
                '╰────────────❒'
            );
        }
    }
};
