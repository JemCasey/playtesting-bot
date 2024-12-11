import { Message } from "discord.js";
import { client } from "src/bot";

export async function getEmojiList(emoji_names: string[]) {
    let emoji_list: string[] = [];
    await client.application?.emojis.fetch().then(function (emojis) {
        emoji_names.forEach(async function (emoji_name: string) {
            try {
                // console.log(`Searching for emoji: ${emoji_name}`);
                var emoji = emojis.find(emoji => emoji.name === emoji_name);
                // console.log(`Found emoji: ${emoji}`);
                if (emoji) {
                    emoji_list.push(`${emoji}`);
                } else {
                    emoji_list.push("");
                }
            } catch (error) {
                console.error("One or more of the emojis failed to fetch: ", error);
                emoji_list.push("");
            }
        })
    });
    return emoji_list;
}

// Don't use this function - it doesn't work for some reason. Prob some scope thing.
export async function getEmoji(emoji_name: string) {
    let emoji_val: string = "";
    await client.application?.emojis.fetch().then(function (emojis) {
        try {
            console.log(`Searching for emoji: ${emoji_name}`);
            var emoji = emojis.find(emoji => emoji.name === emoji_name);
            console.log(`Found emoji: ${emoji}`);
            if (emoji) {
                emoji_val = `${emoji}`;
            } else {
                emoji_val = "";
            }
        } catch (error) {
            console.error("One or more of the emojis failed to fetch: ", error);
            emoji_val = "";
        }
    });
    return emoji_val;
}

export async function reactEmoji(message: Message, emoji_name: string) {
    await client.application?.emojis.fetch().then(function (emojis) {
        try {
            // console.log(`Searching for emoji: ${emoji_name}`);
            var emoji = emojis.find(emoji => emoji.name === emoji_name);
            // console.log(`Found emoji: ${emoji}`);
            if (emoji) {
                message.react(emoji?.id);
            }
        } catch (error) {
            console.error("One or more of the emojis failed to fetch: ", error);
        }
    });
}

export async function reactEmojiList(message: Message, emoji_names: string[]) {
    await client.application?.emojis.fetch().then(function (emojis) {
        emoji_names.forEach(async function (emoji_name: string) {
            try {
                // console.log(`Searching for emoji: ${emoji_name}`);
                var emoji = emojis.find(emoji => emoji.name === emoji_name);
                // console.log(`Found emoji: ${emoji}`);
                if (emoji) {
                    message.react(emoji?.id);
                }
            } catch (error) {
                console.error("One or more of the emojis failed to fetch: ", error);
            }
        })
    });
}
