import { Interaction } from "discord.js";
import { BONUS_REGEX, TOSSUP_REGEX } from "src/constants";
import { QuestionType, UserBonusProgress, UserTossupProgress, getEmbeddedMessage, getTossupParts, removeBonusValue, removeSpoilers } from "src/utils";

export default async function handleButtonClick(interaction: Interaction, setUserProgress: (key: any, value: any) => void) {
    if (interaction.isButton() && interaction.customId === 'play_question') {
        const message = await interaction.message.channel.messages.fetch(interaction.message.id);

        if (message?.reference?.messageId) {
            const questionMessage = await interaction.message.channel.messages.fetch(message.reference.messageId);
            const bonusMatch = questionMessage.content.match(BONUS_REGEX);
            const tossupMatch = questionMessage.content.match(TOSSUP_REGEX);

            if (bonusMatch) {
                const [_, leadin, part1, answer1, part2, answer2, part3, answer3] = bonusMatch;

                setUserProgress(interaction.user.id, {
                    type: QuestionType.Bonus,
                    serverId: message.guild?.id,
                    channelId: message.channelId,
                    questionId: questionMessage.id,
                    authorName: questionMessage.author.username,
                    authorId: questionMessage.author.id,
                    leadin,
                    parts: [part1, part2, part3],
                    answers: [answer1, answer2, answer3],
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
                    questionId: questionMessage.id,
                    authorName: questionMessage.author.username,
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