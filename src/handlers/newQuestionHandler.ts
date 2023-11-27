import { Message } from "discord.js";
import { BONUS_DIFFICULTY_REGEX, BONUS_REGEX, TOSSUP_REGEX } from "src/constants";
import KeySingleton from "src/services/keySingleton";
import { buildButtonMessage, getCategoryCount, getServerChannels, getTossupParts, removeSpoilers, saveBonus, saveTossup, shortenAnswerline } from "src/utils";

const extractCategory = (metadata:string | undefined) => {
    if (!metadata)
        return "";
    
    metadata = removeSpoilers(metadata);
    let results = metadata.match(/([A-Z]{2,3}), (.*)/);

    if (results)
        return results[2].trim();
    
    results = metadata.match(/(.*), ([A-Z]{2,3})/);

    if (results)
        return results[1].trim();
    
    return "";
}

async function handleThread(message:Message, isBonus: boolean, question:string, metadata:string) {
    if (message.content.includes('!t')) {
        const thread = await message.startThread({
            name: metadata ? 
                `${removeSpoilers(metadata)} - ${isBonus ? "Bonus" : "Tossup"} ${getCategoryCount(message.author.id, message.guild?.id, extractCategory(metadata), isBonus)}` 
                : `"${question.substring(0, 30)}..."`,
            autoArchiveDuration: 60
        });

        thread.members.add(message.author);
    }
}

export default async function handleNewQuestion(message:Message<boolean>) {
    const bonusMatch = message.content.match(BONUS_REGEX);
    const tossupMatch = message.content.match(TOSSUP_REGEX);
    const playtestingChannels = getServerChannels(message.guild!.id);
    const key = KeySingleton.getInstance().getKey(message);

    if (playtestingChannels.find(c => c.channel_id === message.channel.id) && (bonusMatch || tossupMatch)) {
        let threadQuestionText = '';
        let threadMetadata = '';

        if (bonusMatch) {
            const [_, __, part1, answer1, part2, answer2, part3, answer3, metadata, difficultyPart1, difficultyPart2, difficultyPart3] = bonusMatch;
            const difficulty1Match = part1.match(BONUS_DIFFICULTY_REGEX) || [];
            const difficulty2Match = part2.match(BONUS_DIFFICULTY_REGEX) || [];
            const difficulty3Match = part3.match(BONUS_DIFFICULTY_REGEX) || [];
            threadQuestionText = part1;
            threadMetadata = metadata;

            saveBonus(message.id, message.guildId!, message.author.id, extractCategory(metadata), [
                { part: 1, answer: shortenAnswerline(answer1), difficulty: difficultyPart1 || difficulty1Match[1] || null},
                { part: 2, answer: shortenAnswerline(answer2), difficulty: difficultyPart2 || difficulty2Match[1] || null},
                { part: 3, answer: shortenAnswerline(answer3), difficulty: difficultyPart3 || difficulty3Match[1] || null}
            ], key);
        } else if (tossupMatch) {
            const [_, question, answer, metadata] = tossupMatch;
            const tossupParts = getTossupParts(question);
            const questionLength = tossupParts.reduce((a, b) => {
                return a + b.length;
            }, 0);
            threadQuestionText = question;
            threadMetadata = metadata;

            // if a tossup was sent that has 2 or fewer spoiler tagged sections, assume that it's not meant to be played
            if (tossupParts.length <= 2)
                return;

            saveTossup(message.id, message.guildId!, message.author.id, questionLength, extractCategory(metadata), shortenAnswerline(answer), key);
        }

        await message.reply(buildButtonMessage(!!bonusMatch));
        await handleThread(message, !!bonusMatch, threadQuestionText, threadMetadata);
    }
}