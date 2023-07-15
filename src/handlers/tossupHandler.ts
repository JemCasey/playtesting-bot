import { Client, EmbedBuilder, Message, TextChannel } from "discord.js";
import { ServerChannelType, getEmbeddedMessage, getServerChannels, removeSpoilers, saveBuzz, shortenAnswerline } from "src/utils";

export default async function handleTossupPlaytest(message: Message<boolean>, client: Client<boolean>, userProgress: any, setUserProgress: (key: any, value: any) => void, deleteUserProgres: (key: any) => void) {
    if (message.content.toLowerCase().startsWith('x')) {
        deleteUserProgres(message.author.id);
        message.author.send(getEmbeddedMessage("Ended tossup reading."));
    } else if ((!userProgress.buzzed && !userProgress.grade && message.content.toLowerCase().startsWith('n')) || (userProgress.buzzed && message.content.toLowerCase().startsWith('w'))) {
        let index = userProgress.index + 1;

        setUserProgress(message.author.id, {
            ...userProgress,
            buzzed: false,
            grade: false,
            index
        });

        if (userProgress.questionParts.length > index)
            message.author.send(userProgress.questionParts[index]);
        if (userProgress.questionParts.length - 1 <= index)
            message.author.send(getEmbeddedMessage("You've reached the end of the question. Please buzz by typing `b`/`buzz` or end by typing `e`/`end`"));
    } else if (message.content.toLowerCase().startsWith("b")) {
        setUserProgress(message.author.id, {
            ...userProgress,
            buzzed: true
        });
        message.author.send(getEmbeddedMessage("Reveal answer? Type `y`/`yes` to see answer or `w`/`withdraw` to withdraw and continue playing"));
    } else if (message.content.toLowerCase().startsWith("y") && userProgress.buzzed) {
        setUserProgress(message.author.id, {
            ...userProgress,
            buzzed: false,
            grade: true
        });

        message.author.send(`ANSWER: ${removeSpoilers(userProgress.answer)}`);
        message.author.send(getEmbeddedMessage("Were you correct? Type `y`/`yes` or `n`/`no`. If you'd like to indicate your answer, you can put it in parenthesis at the end of your message, e.g. `y (foo)`"));
    } else if (message.content.toLowerCase().startsWith('e') || ((message.content.toLowerCase().startsWith('y') || message.content.toLowerCase().startsWith('n')) && userProgress.grade)) {
        const note = message.content.match(/\((.+)\)/);
        const resultsChannels = getServerChannels(userProgress.serverId, ServerChannelType.Results);
        let resultMessage = '';
        let buzzIndex = userProgress.index >= userProgress.questionParts.length ? userProgress.questionParts.length - 1 : userProgress.index;
        let value = message.content.toLowerCase().startsWith('y') ? 10 : (buzzIndex >= userProgress.questionParts.length ? 0 : -5);
        let sanitizedNote = note ? note[1].replaceAll('||', '') : null;

        if (message.content.toLowerCase().startsWith('e')) {
            resultMessage = `<@${message.author.id}> did not buzz on ||${shortenAnswerline(userProgress.answer)}||`
        } else {
            resultMessage = `<@${message.author.id}> ${value > 0 ? "buzzed correctly" : "buzzed incorrectly"} on ||${shortenAnswerline(userProgress.answer)}|| at "||${userProgress.questionParts[buzzIndex]}||"${note ? `; answer given was "||${sanitizedNote}||."` : ''}`
        }

        saveBuzz(userProgress.serverId, userProgress.questionId, userProgress.authorId, message.author.id, buzzIndex, value, sanitizedNote);

        for (let resultChannel of resultsChannels) {
            const threadName = `Buzzes for ${userProgress.authorName}'s tossup beginning "${userProgress.questionParts[0].slice(0, 30)}..."`;
            const channel = client.channels.cache.get(resultChannel.channel_id) as TextChannel;
            let thread = channel.threads.cache.find(x => x.name === threadName);

            if (!thread) {
                thread = await channel.threads.create({
                    name: threadName,
                    autoArchiveDuration: 60
                });
            }

            thread.send(resultMessage);
        }

        deleteUserProgres(message.author.id);

        message.author.send(getEmbeddedMessage(`Thanks, your result has been sent to ${resultsChannels.map(c => `<#${c.channel_id}>`).join(', ')}`));
    } else {
        message.author.send({
            embeds: [
                new EmbedBuilder().setDescription("Command not recognized")
            ]
        })
    }
}