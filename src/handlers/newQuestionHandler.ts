import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } from "discord.js";
import { BONUS_DIFFICULTY_REGEX, BONUS_REGEX, TOSSUP_REGEX } from "src/constants";
import KeySingleton from "src/services/keySingleton";
import { ServerChannelType, getServerChannels, getTossupParts, removeSpoilers, saveBonus, saveTossup, shortenAnswerline } from "src/utils";

export default async function handleNewQuestion(message:Message<boolean>) {
    const bonusMatch = message.content.match(BONUS_REGEX);
    const tossupMatch = message.content.match(TOSSUP_REGEX);
    const playtestingChannels = getServerChannels(message.guild!.id, ServerChannelType.Playtesting);
    const key = KeySingleton.getInstance().getKey(message);

    if (playtestingChannels.find(c => c.channel_id === message.channel.id) && (bonusMatch || tossupMatch)) {
        const buttonLabel = 'Play ' + (bonusMatch ? "Bonus" : "Tossup");
        const button = new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setLabel(buttonLabel)
            .setCustomId('play_question');

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        if (bonusMatch) {
            const [_, __, part1, answer1, part2, answer2, part3, answer3, category] = bonusMatch;
            const difficulty1Match = part1.match(BONUS_DIFFICULTY_REGEX) || [];
            const difficulty2Match = part2.match(BONUS_DIFFICULTY_REGEX) || [];
            const difficulty3Match = part3.match(BONUS_DIFFICULTY_REGEX) || [];

            saveBonus(message.id, message.guildId!, message.author.id, removeSpoilers(category), [
                { part: 1, answer: shortenAnswerline(answer1), difficulty: difficulty1Match[1] || null},
                { part: 2, answer: shortenAnswerline(answer2), difficulty: difficulty2Match[1] || null},
                { part: 3, answer: shortenAnswerline(answer3), difficulty: difficulty3Match[1] || null}
            ], key);
        } else if (tossupMatch) {
            const [_, question, answer, category] = tossupMatch;
            const tossupParts = getTossupParts(question);
            const questionLength = tossupParts.reduce((a, b) => {
                return a + b.length;
            }, 0);

            // if a tossup was sent that has 2 or fewer spoiler tagged sections, assume that it's not meant to be played
            if (tossupParts.length <= 2)
                return;

            saveTossup(message.id, message.guildId!, message.author.id, questionLength, category ? removeSpoilers(category) : "", shortenAnswerline(answer), key);
        }

        await message.reply({ components: [row] });
    }
}