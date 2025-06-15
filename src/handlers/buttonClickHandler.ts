import { Interaction, TextChannel } from "discord.js";
import { client } from "src/bot";
import { asyncCharLimit, BONUS_DIFFICULTY_REGEX, BONUS_REGEX, bulkCharLimit, TOSSUP_REGEX } from "src/constants";
import { buildButtonMessage, QuestionType, UserBonusProgress, UserProgress, UserTossupProgress, getEmbeddedMessage, getTossupParts, getToFirstIndicator, removeBonusValue, removeSpoilers, getCategoryName, getCategoryRole, isNumeric, removeQuestionNumber, getQuestionNumber, addRoles, getServerSettings, getAuthorName, cleanThreadName, getCategoryCount, getResultsThreadId, getServerChannels, stripFormatting } from "src/utils";

export default async function handleButtonClick(interaction: Interaction, userProgress: Map<string, UserProgress>, setUserProgress: (key: any, value: any) => void) {
    if (interaction.isButton() && interaction.customId === "play_question") {
        const message = await interaction.message.channel.messages.fetch(interaction.message.id);

        if (message?.reference?.messageId) {
            const questionMessage = await interaction.message.channel.messages.fetch(message.reference.messageId);
            const bonusMatch = questionMessage.content.match(BONUS_REGEX);
            const tossupMatch = questionMessage.content.match(TOSSUP_REGEX);
            const posterName = (questionMessage.member?.displayName ?? questionMessage.author.username).split(" ")[0];

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
                const authorName = getAuthorName(metadata) ?? posterName;

                setUserProgress(interaction.user.id, {
                    type: QuestionType.Bonus,
                    serverId: message.guild?.id,
                    channelId: message.channelId,
                    buttonMessageId: message.id,
                    questionId: questionMessage.id,
                    questionUrl: questionMessage.url,
                    posterName,
                    posterId: questionMessage.author.id,
                    authorName,
                    leadin,
                    parts: [part1, part2, part3],
                    answers: [answer1, answer2, answer3],
                    difficulties: [difficulty1, difficulty2, difficulty3],
                    index: 0,
                    results: []
                } as UserBonusProgress);

                await interaction.user.send(getEmbeddedMessage("Here's your bonus! Type `d`/`direct` to check your the answer to the current part, `p`/`pass` if you don't have a guess, or `u`/`undo` to go back to the previous part. Type `x` to exit reading without sharing results."));
                await interaction.user.send(removeSpoilers(leadin) + "\n" + removeSpoilers(removeBonusValue(part1)));
            } else if (tossupMatch) {
                const [_, question, answer, metadata] = tossupMatch;
                const questionParts = getTossupParts(question);
                const authorName = getAuthorName(metadata) ?? posterName;

                setUserProgress(interaction.user.id, {
                    type: QuestionType.Tossup,
                    serverId: message.guild?.id,
                    channelId: message.channelId,
                    buttonMessageId: message.id,
                    questionId: questionMessage.id,
                    questionUrl: questionMessage.url,
                    posterName,
                    posterId: questionMessage.author.id,
                    authorName,
                    buzzed: false,
                    questionParts,
                    guesses: [],
                    answer,
                    index: 0
                } as UserTossupProgress);

                if (questionParts[0]) {
                    await interaction.user.send(getEmbeddedMessage("Here's your tossup! Type `b`/`buzz` to buzz, `n`/`next` to see the next clue, or `u`/`undo` to go back to the previous clue. You may share your guess or a comment at this point by putting it in parentheses at the end of your message — e.g. `n (foo? bar?)`. Type `x` to exit reading without sharing results."));
                    await interaction.user.send(questionParts[0]);
                } else {
                    await interaction.user.send(getEmbeddedMessage("Oops, looks like the question wasn't properly spoiler tagged. Let the author know so they can fix!"));
                }
            }
        }
    } else if (interaction.isButton() && (interaction.customId === "async_thread" || interaction.customId === "bulk_thread")) {
        const message = await interaction.message.channel.messages.fetch(interaction.message.id);

        let thisServerSetting = getServerSettings(message.guild!.id).find(ss => ss.server_id == message.guild!.id);
        if (message?.reference?.messageId) {
            const questionMessage = await interaction.message.channel.messages.fetch(message.reference.messageId);
            const bonusMatch = questionMessage.content.match(BONUS_REGEX);
            const tossupMatch = questionMessage.content.match(TOSSUP_REGEX);

            let threadName = "Discussion Thread";
            let fallbackName = "";
            let questionNumber = "";
            let categoryName = "";
            let categoryRoleName = "";

            if (bonusMatch) {
                let [_, leadin, part1, answer1, part2, answer2, part3, answer3, metadata, difficultyPart1, difficultyPart2, difficultyPart3] = bonusMatch;
                questionNumber = getQuestionNumber(leadin);
                metadata = removeSpoilers(metadata);

                if (metadata) {
                    categoryName = getCategoryName(metadata);
                    categoryRoleName = getCategoryRole(categoryName);
                }

                if (interaction.customId === "async_thread") {
                    fallbackName = cleanThreadName(getToFirstIndicator(stripFormatting(removeQuestionNumber(leadin)), asyncCharLimit));
                    threadName = metadata ?
                        `${metadata} | B${getCategoryCount(questionMessage.author.id, message.guild?.id, categoryName, true)}` :
                        `B | ${fallbackName}`;
                } else if (interaction.customId === "bulk_thread") {
                    fallbackName = cleanThreadName(getToFirstIndicator(stripFormatting(removeQuestionNumber(leadin)), bulkCharLimit));
                    threadName = metadata ?
                        `${thisServerSetting?.packet_name ? thisServerSetting?.packet_name + "." : ""}B${isNumeric(questionNumber) ? questionNumber: ""} | ${categoryName} | ${fallbackName}` :
                        `B | ${fallbackName}`;
                }
            } else if (tossupMatch) {
                let [_, question, answer, metadata] = tossupMatch;
                questionNumber = getQuestionNumber(question);
                metadata = removeSpoilers(metadata);

                if (metadata) {
                    categoryName = getCategoryName(metadata);
                    categoryRoleName = getCategoryRole(categoryName);
                }

                if (interaction.customId === "async_thread") {
                    fallbackName = cleanThreadName(getToFirstIndicator(stripFormatting(removeQuestionNumber(question)), asyncCharLimit));
                    threadName = metadata ?
                        `${metadata} | T${getCategoryCount(questionMessage.author.id, message.guild?.id, categoryName, false)}` :
                        `T | ${fallbackName}`;
                } else if (interaction.customId === "bulk_thread") {
                    fallbackName = cleanThreadName(getToFirstIndicator(stripFormatting(removeQuestionNumber(question)), bulkCharLimit));
                    threadName = metadata ?
                        `${thisServerSetting?.packet_name ? thisServerSetting?.packet_name + "." : ""}T${isNumeric(questionNumber) ? questionNumber: ""} | ${categoryName} | ${fallbackName}` :
                        `T | ${fallbackName}`;
                }
            }

            const thread = await questionMessage.startThread({
                name: threadName.replaceAll(/\s\s+/g, " ").trim(),
                autoArchiveDuration: 60
            });

            if (thread) {
                if (interaction.customId === "async_thread") {
                    const buttonLabel = "Play " + (!!bonusMatch ? "Bonus" : "Tossup");
                    let resultsThreadId = getResultsThreadId(questionMessage.id, !!bonusMatch ? QuestionType.Bonus : QuestionType.Tossup);
                    if (resultsThreadId) {
                        const resultChannel = getServerChannels(message.guild!.id).find(s => (s.channel_id === message.channelId && s.channel_type === 1));
                        const resultsChannel = client.channels.cache.get(resultChannel!.result_channel_id) as TextChannel;
                        const resultsMessage = await resultsChannel.messages.fetch(resultsThreadId);
                        message.edit(buildButtonMessage([
                            {label: buttonLabel, id: "play_question", url: ""},
                            {label: "Results", id: "", url: resultsMessage.thread?.url || ""}
                        ]));
                    } else {
                        message.edit(buildButtonMessage([
                            {label: buttonLabel, id: "play_question", url: ""}
                        ]));
                    }
                    await thread.members.add(message.author);
                } else {
                    message.edit(buildButtonMessage([
                        {label: "Discussion Thread", id: "bulk_thread", url: thread.url}
                    ]));
                }
                await addRoles(message, thread, "Head Editor", false);
                await addRoles(message, thread, categoryRoleName, true);
            }
        }
    }
}
