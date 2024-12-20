import { Message, TextChannel } from "discord.js";
import { getServerChannels, getBulkQuestionsInPacket, BulkQuestion, formatPercent } from "src/utils";
import { client } from "src/bot";
import { getEmojiList } from "src/utils/emojis";

type userReact = {
    emoji: string;
    count: number;
}

export default async function handleTally(serverId: string, packetName: string, message: Message) {
    let packetBulkQuestions = getBulkQuestionsInPacket(serverId, packetName);
    if (packetBulkQuestions.length > 0) {
        packetBulkQuestions.forEach(async function (bulkQuestion: BulkQuestion) {
            let echoChannelId = getServerChannels(serverId).find(c => (c.channel_type === 3))?.channel_id;
            if (echoChannelId) {
                let echoChannel = client.channels.cache.get(echoChannelId) as TextChannel;
                let echoMessage = await echoChannel.messages.fetch(bulkQuestion.echo_id);

                let questionChannel = client.channels.cache.get(bulkQuestion.channel_id) as TextChannel;
                let questionMessage = await questionChannel.messages.fetch(bulkQuestion.question_id);
                if (echoMessage && questionMessage) {
                    let reacts: string[] = [];
                    if (bulkQuestion.question_type === "B") {
                        reacts = [...reacts, "bonus_E", "bonus_M", "bonus_H", "bonus_0"];
                    } else {
                        if (questionMessage.content.includes("\(\*\)")) {
                            reacts = [...reacts, "tossup_15"];
                        }
                        reacts = [
                            ...reacts,
                            "tossup_10", "tossup_0", "tossup_neg5",
                            "tossup_DNC",
                            // "tossup_FTP",
                        ];
                    }
                    let react_emoji = await getEmojiList(reacts);
                    let reactUsers: Number[] = [];
                    let reactCounts: userReact[] = [];
                    questionMessage.reactions.cache?.filter(react => react_emoji.includes(react.emoji.toString()) && react.count).forEach(async react => {
                        let thisReactUsers = react.users.cache.map(u => Number(u.id));
                        if (thisReactUsers) {
                            reactUsers = [...reactUsers, ...thisReactUsers];
                            reactCounts.push({
                                emoji: react.emoji.toString(),
                                count: react.count - 1
                            });
                        }
                    });
                    if (reactCounts.some(userReact => userReact.count > 0)) {
                        let answer_emoji = await getEmojiList(["answer"]);
                        let newEcho = "### [" +
                        (bulkQuestion.question_type === "B" ? "Bonus" : "Tossup") +
                        (bulkQuestion.question_number ? (" " + bulkQuestion.question_number) : "") + " - " +
                        bulkQuestion.category +
                        "](" + questionMessage.url + ")" + "\n" +
                        "* " + ((answer_emoji[0] + " ") || "") +
                        `||${bulkQuestion.answers}||`;

                        let play_count_emoji = await getEmojiList(["play_count"]);
                        let reactedUsers = [... new Set(reactUsers)].filter(u => u != Number(client.user?.id));
                        let playCount = reactedUsers.length > 0 ? reactedUsers.length : 1;
                        newEcho += `\n* **${playCount}** × ${play_count_emoji} \t`;
                        newEcho += reactCounts.map(userReact =>
                            `**${userReact.count}** × ${userReact.emoji} (${formatPercent(userReact.count/playCount)})`
                        ).join("\t");

                        echoMessage.edit(newEcho);
                    }
                }
            }

        });
        message.reply(`Tallied reacts for ${packetBulkQuestions.length} questions in packet ${packetName}.`)
    } else {
        message.reply(`No questions in packet ${packetName} yet.`);
    }
}