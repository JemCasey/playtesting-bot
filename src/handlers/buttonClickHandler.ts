import { Interaction } from "discord.js";
import { BONUS_DIFFICULTY_REGEX, BONUS_REGEX, TOSSUP_REGEX } from "src/constants";
import { QuestionType, UserBonusProgress, UserProgress, UserTossupProgress, getEmbeddedMessage, getTossupParts, removeBonusValue, removeSpoilers } from "src/utils";

export default async function handleButtonClick(interaction: Interaction, userProgress: Map<string, UserProgress>, setUserProgress: (key: any, value: any) => void) {
    if (interaction.isButton() && interaction.customId === 'play_question') {
        const message = await interaction.message.channel.messages.fetch(interaction.message.id);

        if (message?.reference?.messageId) {
            const questionMessage = await interaction.message.channel.messages.fetch(message.reference.messageId);
            const bonusMatch = questionMessage.content.match(BONUS_REGEX);
            const tossupMatch = questionMessage.content.match(TOSSUP_REGEX);
            const authorName = questionMessage.member?.displayName ?? questionMessage.author.username;

            if (userProgress.get(interaction.user.id)) {
                await interaction.user.send(getEmbeddedMessage("You tried to start playtesting a question but have a different question reading in progress. Please complete that reading or type `x` to end it, then try again."));
            } else if (bonusMatch) {
                const [_, leadin, part1, answer1, part2, answer2, part3, answer3, metadata, difficultyPart1, difficultyPart2, difficultyPart3] = bonusMatch;
                const difficulty1Match = part1.match(BONUS_DIFFICULTY_REGEX) || [];
                const difficulty2Match = part2.match(BONUS_DIFFICULTY_REGEX) || [];
                const difficulty3Match = part3.match(BONUS_DIFFICULTY_REGEX) || [];
                const difficulty1 = difficultyPart1 || difficulty1Match[1] || "e";
                const difficulty2 = difficultyPart2 || difficulty2Match[1] || "m";
                const difficulty3 = difficultyPart3 || difficulty3Match[1] || "h";

                setUserProgress(interaction.user.id, {
                    type: QuestionType.Bonus,
                    serverId: message.guild?.id,
                    channelId: message.channelId,
                    buttonMessageId: message.id,
                    questionId: questionMessage.id,
                    questionUrl: questionMessage.url,
                    authorName,
                    authorId: questionMessage.author.id,
                    leadin,
                    parts: [part1, part2, part3],
                    answers: [answer1, answer2, answer3],
                    difficulties: [difficulty1, difficulty2, difficulty3],
                    index: 0,
                    results: []
                } as UserBonusProgress);

                await interaction.user.send(getEmbeddedMessage("Here's your bonus! Type `d`/`direct` to check your the answer to the current part, or `p`/`pass` if you don't have a guess. Type `x` to exit reading without sharing results."));
                await interaction.user.send(removeSpoilers(leadin) + '\n' + removeSpoilers(removeBonusValue(part1)));
            } else if (tossupMatch) {
                const [_, question, answer] = tossupMatch;
                const questionParts = getTossupParts(question);

                setUserProgress(interaction.user.id, {
                    type: QuestionType.Tossup,
                    serverId: message.guild?.id,
                    channelId: message.channelId,
                    buttonMessageId: message.id,
                    questionId: questionMessage.id,
                    questionUrl: questionMessage.url,
                    authorName,
                    authorId: questionMessage.author.id,
                    buzzed: false,
                    questionParts,
                    guesses: [],
                    answer,
                    index: 0
                } as UserTossupProgress);

                if (questionParts[0]) {
                    await interaction.user.send(getEmbeddedMessage("Here's your tossup! Please type `n`/`next` to see the next clue or `b`/`buzz` to buzz. If you'd like to share your guess at this point in the question, you can put it in parenthesis at the end of your message, e.g. `n (thinking foo or bar)`. Type `x` to exit reading without sharing results."));
                    await interaction.user.send(questionParts[0]);
                } else {
                    await interaction.user.send(getEmbeddedMessage("Oops, looks like the question wasn't properly spoiler tagged. Let the author know so they can fix!"));
                }
            }
        }
    }

}
