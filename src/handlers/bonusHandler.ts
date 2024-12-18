import { Client, Message, TextChannel } from "discord.js";
import KeySingleton from "src/services/keySingleton";
import { UserBonusProgress, getEmbeddedMessage, getServerChannels, getSilentMessage, getThreadAndUpdateSummary, getToFirstIndicator, removeBonusValue, removeSpoilers, saveBonusDirect, shortenAnswerline } from "src/utils";

export default async function handleBonusPlaytest(message: Message<boolean>, client: Client<boolean>, userProgress: UserBonusProgress, setUserProgress: (key: any, value: any) => void, deleteUserProgress: (key: any) => void) {
    let validGradingResponse = userProgress.grade && (message.content.toLowerCase().startsWith('y') || message.content.toLowerCase().startsWith('n'));

    if (message.content.toLowerCase().startsWith('x')) {
        deleteUserProgress(message.author.id);
        await message.author.send(getEmbeddedMessage("Ended bonus reading.", true));

        return;
    }

    if (!userProgress.grade && (message.content.toLowerCase().startsWith('d') || message.content.toLowerCase().startsWith('p'))) {
        await message.author.send(getSilentMessage(`ANSWER: ${removeSpoilers(userProgress.answers![userProgress.index])}`));
    }

    if (!userProgress.grade && message.content.toLowerCase().startsWith('d')) {
        setUserProgress(message.author.id, {
            ...userProgress,
            grade: true
        });

        await message.author.send(getEmbeddedMessage("Were you correct? Type `y`/`yes` or `n`/`no`. If you'd like to indicate your answer, you can put it in parenthesis at the end of your message, e.g. `y (foo)`", true));
    }

    if (validGradingResponse || (!userProgress.grade && message.content.toLowerCase().startsWith('p'))) {
        const note = message.content.match(/\((.+)\)/);
        const results = [
            ...userProgress.results, {
                points: message.content.toLowerCase().startsWith('y') ? 10 : 0,
                passed: message.content.toLowerCase().startsWith('p'),
                note: note ? note[1] : null
            }
        ];
        const index = userProgress.index + 1;

        setUserProgress(message.author.id, {
            ...userProgress,
            grade: false,
            index,
            results
        });

        if (userProgress.parts.length > index) {
            await message.author.send(getSilentMessage(removeBonusValue(removeSpoilers(userProgress.parts[index] || ''))));
        } else {
            const key = KeySingleton.getInstance().getKey(message);
            const resultChannel = getServerChannels(userProgress.serverId).find(s => (s.channel_id === userProgress.channelId && s.channel_type === 1));
            let resultMessage = ``;
            let points_emoji_names: string[] = [];
            let emoji_summary: string[] = [];
            let partMessages: string[] = [];
            let totalPoints = 0;

            results.forEach(async function(r: any, i: number) {
                let answer = shortenAnswerline(userProgress.answers[i]);
                let partMessage = '';
                var points_emoji_name = "";

                if (r.points > 0) {
                    points_emoji_name = "bonus_";
                    totalPoints += r.points;
                    partMessage += `got ||${answer}||`;
                } else if (!r.passed) {
                    points_emoji_name = "missed_";
                    partMessage += `missed ||${answer}||`;
                } else {
                    points_emoji_name = "missed_";
                    partMessage += `passed ||${answer}||`;
                }
                points_emoji_name += userProgress.difficulties[i]?.toUpperCase()

                points_emoji_names.push(points_emoji_name);
                partMessage += (r.note ? ` (answer: "||${r.note}||")` : '');
                partMessages.push(partMessage);
                saveBonusDirect(userProgress.serverId, userProgress.questionId, userProgress.authorId, message.author.id, i + 1, r.points, r.note, key);
            });

            await client.application?.emojis.fetch().then(function(emojis) {
                try {
                    points_emoji_names.forEach(function(points_emoji_name) {
                        // console.log(`Searching for emoji: ${points_emoji_name}`);
                        var points_emoji = emojis.find(emoji => emoji.name === points_emoji_name);
                        // console.log(`Found emoji: ${points_emoji}`);
                        if (points_emoji) {
                            emoji_summary.push(`${points_emoji}`);
                        }
                    });
                } catch (error) {
                    console.error("One or more of the bonus points emojis failed to fetch:", error);
                }
            });

            resultMessage += emoji_summary.join(' ');
            resultMessage += ` <@${message.author.id}> scored ${totalPoints} points: `;
            resultMessage += partMessages.join(', ');

            const threadName = `B | ${userProgress.authorName} | "${getToFirstIndicator(userProgress.leadin)}"`;
            const resultsChannel = client.channels.cache.get(resultChannel!.result_channel_id) as TextChannel;
            const playtestingChannel = client.channels.cache.get(userProgress.channelId) as TextChannel;
            const thread = await getThreadAndUpdateSummary(userProgress, threadName.slice(0, 100), resultsChannel, playtestingChannel);

            await thread.send(resultMessage);

            deleteUserProgress(message.author.id);

            await message.author.send(getEmbeddedMessage(`Your result has been sent to <#${thread.id}>.`, true));
        }
    }
}
