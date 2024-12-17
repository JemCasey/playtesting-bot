import { Message, Application, TextChannel } from "discord.js";
import { asyncCharLimit, BONUS_DIFFICULTY_REGEX, BONUS_REGEX, bulkCharLimit, TOSSUP_REGEX } from "src/constants";
import KeySingleton from "src/services/keySingleton";
import { buildButtonMessage, getCategoryCount, getServerChannels, getTossupParts, getToFirstIndicator, removeSpoilers, saveBonus, BonusPart, saveTossup, shortenAnswerline, getCategoryName, getCategoryRole, isNumeric, serverSettings, ServerChannel, removeQuestionNumber, getQuestionNumber, addRoles } from "src/utils";
import { client } from "src/bot";
import { getEmojiList, reactEmojiList } from "src/utils/emojis";

async function handleThread(msgChannel: ServerChannel, message: Message, isBonus: boolean, question: string, metadata: string, questionNumber: string = "") {
    let thisServerSetting = serverSettings.find(ss => ss.serverId == message.guild!.id);
    let threadName = "Discussion Thread";
    let fallbackName = getToFirstIndicator(removeQuestionNumber(question), msgChannel.channel_type === 2 ? bulkCharLimit : asyncCharLimit);
    let categoryName = getCategoryName(metadata);
    let categoryRoleName = getCategoryRole(categoryName);
    // console.log(`Metadata: ${metadata}`);
    // console.log(`Category Name: ${categoryName}; Category Role Name: ${categoryRoleName}`);

    if (msgChannel.channel_type === 2) {
        threadName = metadata ?
            `${thisServerSetting?.packetName ? thisServerSetting?.packetName + "." : ""}${isBonus ? "B" : "T"}${questionNumber} | ${categoryName} | ${fallbackName}` :
            `"${fallbackName}"`;
    } else if (msgChannel.channel_type === 1) {
        threadName = metadata ?
            `${metadata} | ${isBonus ? "B" : "T"}${getCategoryCount(message.author.id, message.guild?.id, categoryName, isBonus)}`
            : `"${fallbackName}"`;
    }

    const thread = await message.startThread({
        name: threadName,
        autoArchiveDuration: 60
    });

    if (thread) {
        if (msgChannel.channel_type !== 2) {
            await thread.members.add(message.author);
        }
        await addRoles(message, thread, "Head Editor", false);
        await addRoles(message, thread, categoryRoleName, true);
    }
}

export async function echoQuestion(question: string, questionUrl: string, echoChannelId: string, echoWhole: boolean) {
    const echoChannel = (client.channels.cache.get(echoChannelId) as TextChannel);
    let echoURL = "";
    await echoChannel.send(question.replace("!t", "").trim()).then( echoMessage => {
        if (echoWhole) {
            echoMessage.reply(buildButtonMessage("echo", "Go to Question", questionUrl));
        }
        echoURL = echoMessage.url;
    });
    return echoURL;
}

async function handleReacts(message: Message, isBonus: boolean, parts: BonusPart[]) {
    var reacts: string[] = [];
    if (isBonus) {
        for (var { part, difficulty, answer } of parts) {
            reacts = [...reacts, "bonus_" + difficulty?.toUpperCase()];
        }
        reacts = [...reacts, "bonus_0"];
    } else {
        reacts = [
            "play_count",
            "tossup_10", "tossup_0", "tossup_neg5",
            "tossup_DNC",
            // "tossup_FTP",
        ];
    }

    await reactEmojiList(message, reacts);
}

export default async function handleNewQuestion(message: Message<boolean>) {
    const bonusMatch = message.content.match(BONUS_REGEX);
    const tossupMatch = message.content.match(TOSSUP_REGEX);
    const playtestingChannels = getServerChannels(message.guild!.id);
    const key = KeySingleton.getInstance().getKey(message);

    const msgChannel = playtestingChannels.find(c => (c.channel_id === message.channel.id));

    if (msgChannel && (bonusMatch || tossupMatch)) {
        let threadQuestionText = '';
        let threadMetadata = '';
        let difficulties = [
            { part: 1, answer: "", difficulty: "" },
            { part: 2, answer: "", difficulty: "" },
            { part: 3, answer: "", difficulty: "" },
        ];
        let questionNumber = "";
        let questionEcho = "";
        let answersEcho: string[] = [];

        if (bonusMatch) {
            const [_, leadin, part1, answer1, part2, answer2, part3, answer3, metadata, difficultyPart1, difficultyPart2, difficultyPart3] = bonusMatch;
            const difficulty1Match = part1.match(BONUS_DIFFICULTY_REGEX) || [];
            const difficulty2Match = part2.match(BONUS_DIFFICULTY_REGEX) || [];
            const difficulty3Match = part3.match(BONUS_DIFFICULTY_REGEX) || [];
            threadQuestionText = leadin;
            threadMetadata = removeSpoilers(metadata);
            questionNumber = getQuestionNumber(leadin);

            difficulties = [
                { part: 1, answer: shortenAnswerline(answer1), difficulty: difficultyPart1 || difficulty1Match[1] || "e" },
                { part: 2, answer: shortenAnswerline(answer2), difficulty: difficultyPart2 || difficulty2Match[1] || "m" },
                { part: 3, answer: shortenAnswerline(answer3), difficulty: difficultyPart3 || difficulty3Match[1] || "h" },
            ];
            if (msgChannel.channel_type === 2) {
                await handleReacts(message, !!bonusMatch, difficulties);
            } else if (msgChannel.channel_type === 1) {
                saveBonus(message.id, message.guildId!, message.author.id, getCategoryName(threadMetadata), difficulties, key);
            }
            answersEcho.push(shortenAnswerline(answer1));
            answersEcho.push(shortenAnswerline(answer2));
            answersEcho.push(shortenAnswerline(answer3));
        } else if (tossupMatch) {
            const [_, question, answer, metadata] = tossupMatch;
            const tossupParts = getTossupParts(question);
            const questionLength = tossupParts.reduce((a, b) => {
                return a + b.length;
            }, 0);
            threadQuestionText = question;
            threadMetadata = removeSpoilers(metadata);
            questionNumber = getQuestionNumber(question);

            // if a tossup was sent that has 2 or fewer spoiler tagged sections, assume that it's not meant to be played
            if (tossupParts.length <= 2)
                return;

            if (msgChannel.channel_type === 2) {
                await handleReacts(message, !!bonusMatch, difficulties);
            } else if (msgChannel.channel_type === 1) {
                saveTossup(message.id, message.guildId!, message.author.id, questionLength, getCategoryName(threadMetadata), shortenAnswerline(answer), key);
            }
            answersEcho.push(shortenAnswerline(answer));
        }

        if (msgChannel.channel_type !== 3) {
            if (msgChannel.channel_type === 2) {
                const echoChannelId = playtestingChannels.find(c => (c.channel_type === 3))?.channel_id;
                if (echoChannelId) {
                    let thisServerSetting = serverSettings.find(ss => ss.serverId == message.guild!.id);
                    if (thisServerSetting?.echoWhole) {
                        questionEcho = message.content.replaceAll("!t", "").trim();
                    } else {
                        let answer_emoji = await getEmojiList(["answer"]);
                        questionEcho = "### [" +
                        (!!bonusMatch ? "Bonus" : "Tossup") +
                        (isNumeric(questionNumber) ? (" " + questionNumber) : "") + " - " +
                        getCategoryName(threadMetadata) +
                        "](" + message.url + ") - " +
                        ((answer_emoji[0] + " ") || "") +
                        "||" + answersEcho.join(" / ") + "||";
                        // questionEcho += " - ||" + getToFirstIndicator(removeQuestionNumber(threadQuestionText), bulkCharLimit) + "||";
                    }
                    echoQuestion(questionEcho, message.url, echoChannelId, thisServerSetting?.echoWhole || false).then(echoURL => {
                        if (message.content.includes('!t')) {
                            message.reply(buildButtonMessage("echo", "Return to List", echoURL));
                        } else {
                            message.reply(buildButtonMessage("bulk_thread", "Create Discussion Thread", "", "Go to Index", echoURL));
                        }
                    });
                }
            } else if (msgChannel.channel_type === 1) {
                await message.reply(buildButtonMessage("play_question", "Play " + (!!bonusMatch ? "Bonus" : "Tossup")));
            }
            if (message.content.includes('!t')) {
                await handleThread(msgChannel, message, !!bonusMatch, threadQuestionText, threadMetadata, isNumeric(questionNumber) ? questionNumber: "");
            }
        }
    }
}
