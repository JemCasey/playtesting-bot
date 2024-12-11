import { Message, Application } from "discord.js";
import { BONUS_DIFFICULTY_REGEX, BONUS_REGEX, TOSSUP_REGEX } from "src/constants";
import KeySingleton from "src/services/keySingleton";
import { buildButtonMessage, getCategoryCount, getServerChannels, getTossupParts, removeSpoilers, saveBonus, BonusPart, saveTossup, shortenAnswerline, extractCategory, isNumeric } from "src/utils";
import { client } from "src/bot";
import { reactEmojiList } from "src/utils/emojis";

async function handleThread(channel_type: number, message: Message, isBonus: boolean, question: string, metadata: string, questionNumber: string = "") {
    if (message.content.includes('!t')) {
        let threadName = "Discussion Thread";

        if (channel_type === 2) {
            threadName = metadata ?
                `${isBonus ? "B" : "T"}${questionNumber} - ${removeSpoilers(metadata)}` :
                `"${question.substring(0, 30)}..."`;
        } else if (channel_type === 1) {
            threadName = metadata ?
                `${removeSpoilers(metadata)} - ${isBonus ? "Bonus" : "Tossup"} ${getCategoryCount(message.author.id, message.guild?.id, extractCategory(metadata), isBonus)}`
                : `"${question.substring(0, 30)}..."`;
        }

        const thread = await message.startThread({
            name: threadName,
            autoArchiveDuration: 60
        });
        if (channel_type !== 2) {
            thread.members.add(message.author);
        }
    }
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

    const msgChannel = playtestingChannels.find(c => c.channel_id === message.channel.id);

    if (msgChannel && (bonusMatch || tossupMatch)) {
        let threadQuestionText = '';
        let threadMetadata = '';
        let difficulties = [
            { part: 1, answer: "", difficulty: "" },
            { part: 2, answer: "", difficulty: "" },
            { part: 3, answer: "", difficulty: "" },
        ];
        let questionNumber = "";

        if (bonusMatch) {
            const [_, leadin, part1, answer1, part2, answer2, part3, answer3, metadata, difficultyPart1, difficultyPart2, difficultyPart3] = bonusMatch;
            const difficulty1Match = part1.match(BONUS_DIFFICULTY_REGEX) || [];
            const difficulty2Match = part2.match(BONUS_DIFFICULTY_REGEX) || [];
            const difficulty3Match = part3.match(BONUS_DIFFICULTY_REGEX) || [];
            threadQuestionText = part1;
            threadMetadata = metadata;
            questionNumber = leadin.charAt(0);

            difficulties = [
                { part: 1, answer: shortenAnswerline(answer1), difficulty: difficultyPart1 || difficulty1Match[1] || "e" },
                { part: 2, answer: shortenAnswerline(answer2), difficulty: difficultyPart2 || difficulty2Match[1] || "m" },
                { part: 3, answer: shortenAnswerline(answer3), difficulty: difficultyPart3 || difficulty3Match[1] || "h" },
            ];
            if (msgChannel.channel_type === 2) {
                await handleReacts(message, !!bonusMatch, difficulties);
            } else {
                saveBonus(message.id, message.guildId!, message.author.id, extractCategory(metadata), difficulties, key);
            }
        } else if (tossupMatch) {
            const [_, question, answer, metadata] = tossupMatch;
            const tossupParts = getTossupParts(question);
            const questionLength = tossupParts.reduce((a, b) => {
                return a + b.length;
            }, 0);
            threadQuestionText = question;
            threadMetadata = metadata;
            questionNumber = question.charAt(0);

            // if a tossup was sent that has 2 or fewer spoiler tagged sections, assume that it's not meant to be played
            if (tossupParts.length <= 2)
                return;

            if (msgChannel.channel_type === 2) {
                await handleReacts(message, !!bonusMatch, difficulties);
            } else {
                saveTossup(message.id, message.guildId!, message.author.id, questionLength, extractCategory(metadata), shortenAnswerline(answer), key);
            }
        }

        let buttonLabel = "";
        if (msgChannel.channel_type === 2) {
            if (!message.content.includes('!t')) {
                buttonLabel = "Create Discussion Thread";
                await message.reply(buildButtonMessage(buttonLabel, "bulk_thread"));
            }
        } else {
            buttonLabel = "Play " + (!!bonusMatch ? "Bonus" : "Tossup");
            await message.reply(buildButtonMessage(buttonLabel));
        }
        await handleThread(msgChannel.channel_type, message, !!bonusMatch, threadQuestionText, threadMetadata, questionNumber);

    }
}
