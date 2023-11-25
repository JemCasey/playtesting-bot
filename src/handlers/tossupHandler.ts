import { Client, Message, TextChannel } from "discord.js";
import KeySingleton from "src/services/keySingleton";
import { UserTossupProgress, getEmbeddedMessage, getServerChannels, getSilentMessage, getThreadAndUpdateSummary, removeSpoilers, saveBuzz, shortenAnswerline } from "src/utils";

export default async function handleTossupPlaytest(message: Message<boolean>, client: Client<boolean>, userProgress: UserTossupProgress, setUserProgress: (key: string, value: UserTossupProgress) => void, deleteUserProgress: (key: any) => void) {
    if (message.content.toLowerCase().startsWith('x')) {
        deleteUserProgress(message.author.id);
        await message.author.send(getEmbeddedMessage("Ended tossup reading.", true));
    } else if ((!userProgress.buzzed && !userProgress.grade && message.content.toLowerCase().startsWith('n')) || (userProgress.buzzed && message.content.toLowerCase().startsWith('w'))) {
        const index = userProgress.index + 1;
        const guess = message.content.match(/\((.+)\)/);
            
        setUserProgress(message.author.id, {
            ...userProgress,
            buzzed: false,
            grade: false,
            guesses: guess ? [...userProgress.guesses, {
                index: userProgress.index,
                guess: guess[1]
            }] : userProgress.guesses,
            index
        });

        if (userProgress.questionParts.length > index)
            await message.author.send(getSilentMessage(userProgress.questionParts[index]));
        if (userProgress.questionParts.length - 1 <= index)
            await message.author.send(getEmbeddedMessage("You've reached the end of the question. Please buzz by typing `b`/`buzz` or end by typing `e`/`end`", true));
    } else if (message.content.toLowerCase().startsWith("b")) {
        setUserProgress(message.author.id, {
            ...userProgress,
            buzzed: true
        });
        await message.author.send(getEmbeddedMessage("Reveal answer? Type `y`/`yes` to see answer or `w`/`withdraw` to withdraw and continue playing", true));
    } else if (message.content.toLowerCase().startsWith("y") && userProgress.buzzed) {
        setUserProgress(message.author.id, {
            ...userProgress,
            buzzed: false,
            grade: true
        });

        await message.author.send(getSilentMessage(`ANSWER: ${removeSpoilers(userProgress.answer)}`));
        await message.author.send(getEmbeddedMessage("Were you correct? Type `y`/`yes` or `n`/`no`. If you'd like to indicate your answer, you can put it in parenthesis at the end of your message, e.g. `y (foo)`", true));
    } else if (message.content.toLowerCase().startsWith('e') || ((message.content.toLowerCase().startsWith('y') || message.content.toLowerCase().startsWith('n')) && userProgress.grade)) {
        const key = KeySingleton.getInstance().getKey(message);
        const note = message.content.match(/\((.+)\)/);
        const resultChannel = getServerChannels(userProgress.serverId).find(s => s.channel_id === userProgress.channelId);
        let resultMessage = '';
        let buzzIndex = userProgress.index >= userProgress.questionParts.length ? userProgress.questionParts.length - 1 : userProgress.index;
        let value = message.content.toLowerCase().startsWith('y') ? 10 : (buzzIndex >= userProgress.questionParts.length - 1 ? 0 : -5);
        let sanitizedNote = note ? note[1].replaceAll('||', '') : null;
        let countIndex = buzzIndex;
        let charactersRevealed = userProgress.questionParts[buzzIndex].length;

        if (message.content.toLowerCase().startsWith('e'))
            await message.author.send(getSilentMessage(`ANSWER: ${removeSpoilers(userProgress.answer)}`));

        if (message.content.toLowerCase().startsWith('e')) {
            resultMessage = `<@${message.author.id}> did not buzz on ||${shortenAnswerline(userProgress.answer)}||`
        } else {
            resultMessage = `<@${message.author.id}> ${value > 0 ? "buzzed correctly" : "buzzed incorrectly"} at "||${userProgress.questionParts[buzzIndex]}||"${note ? `; answer given was "||${sanitizedNote}||"` : ''}`
            + (userProgress.guesses?.length > 0 ? `— was thinking ${userProgress.guesses.map(g => `||${g.guess}|| at clue #${g.index + 1}`).join(', ')}`: '')
        }

        while (countIndex-- > 0)
            charactersRevealed += userProgress.questionParts[countIndex].length;

        saveBuzz(userProgress.serverId, userProgress.questionId, userProgress.authorId, message.author.id, buzzIndex, charactersRevealed, value, sanitizedNote, key);

        const threadName = `Buzzes for ${userProgress.authorName}'s tossup beginning "${userProgress.questionParts[0].slice(0, 30)}..."`;
        const resultsChannel = client.channels.cache.get(resultChannel!.result_channel_id) as TextChannel;
        const playtestingChannel = client.channels.cache.get(userProgress.channelId) as TextChannel;
        const thread = await getThreadAndUpdateSummary(userProgress, threadName, resultsChannel, playtestingChannel);

        await thread.send(resultMessage);

        deleteUserProgress(message.author.id);

        await message.author.send(getEmbeddedMessage(`Thanks, your result has been sent to <#${thread.id}>`, true));
    } else {
        await message.author.send(getEmbeddedMessage("Command not recognized", true));
    }
}