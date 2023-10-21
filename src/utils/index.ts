import { Collection, EmbedBuilder, Guild, Message, MessageCreateOptions, MessageFlags, TextChannel } from "discord.js";
import Database from 'better-sqlite3';
import { encrypt } from "./crypto";
import { sum, group, listify } from 'radash'
import { getBonusSummaryData } from "./queries";

const db = new Database('database.db');

const deleteServerChannelsCommand = db.prepare('DELETE FROM server_channel WHERE server_id = ?');
const insertServerChannelCommand = db.prepare('INSERT INTO server_channel (server_id, channel_id, result_channel_id) VALUES (?, ?, ?)');
const getServerChannelsQuery = db.prepare('SELECT * FROM server_channel WHERE server_id = ?');
const insertBuzzCommand = db.prepare('INSERT INTO buzz (server_id, question_id, author_id, user_id, clue_index, characters_revealed, value, answer_given) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
const insertBonusDirectCommand = db.prepare('INSERT INTO bonus_direct (server_id, question_id, author_id, user_id, part, value, answer_given) VALUES (?, ?, ?, ?, ?, ?, ?)');
const insertTossupCommand = db.prepare('INSERT INTO tossup (question_id, server_id, author_id, total_characters, category, answer) VALUES (?, ?, ?, ?, ?, ?)');
const insertBonusPartCommand = db.prepare('INSERT INTO bonus_part (question_id, part, difficulty, answer) VALUES (?, ?, ?, ?)');
const insertBonusCommand = db.prepare('INSERT INTO bonus (question_id, server_id, author_id, category) VALUES (?, ?, ?, ?)');
const updateTossupThreadCommand = db.prepare('UPDATE tossup SET thread_id = ? WHERE question_id = ?');
const updateBonusThreadCommand = db.prepare('UPDATE bonus SET thread_id = ? WHERE question_id = ?');
const getTossupThreadQuery = db.prepare('SELECT thread_id FROM tossup WHERE question_id = ?');
const getBonusThreadQuery = db.prepare('SELECT thread_id FROM bonus WHERE question_id = ?');
const getTossupBuzzesQuery = db.prepare('SELECT clue_index, value, characters_revealed FROM buzz WHERE question_id = ? ORDER BY clue_index');

type nullableString = string | null | undefined;

export const removeSpoilers = (text: string) => text.replaceAll('||', '');
export const shortenAnswerline = (answerline: string) => removeSpoilers(answerline.replace(/ \[.+\]/, '').replace(/ \(.+\)/, '')).trim();
export const removeBonusValue = (bonusPart: string) => bonusPart.replace(/\|{0,2}\[10\|{0,2}[emh]?\|{0,2}]\|{0,2} ?/, '');
export const formatPercent = (value: number | null | undefined, minimumFractionDigits:number = 2) => value == null || value == undefined ? "" : value.toLocaleString(undefined, { style: 'percent', minimumFractionDigits });
export const formatDecimal = (value: number | null | undefined) => value == null || value == undefined ? "" : value?.toFixed(2);

export enum ServerChannelType {
    Playtesting = 1,
    Results
}

export enum QuestionType {
    Tossup = 1,
    Bonus
}

export type ServerChannel = {
    server_id: string;
    channel_id: string;
    result_channel_id: string;
}

export type QuestionResult = {
    points: number;
    passed: boolean;
    note: string;
}

export type UserProgress = {
    type: QuestionType;
    serverId: string;
    channelId: string;
    questionId: string;
    authorId: string;
    authorName: string;
    index: number;
    grade?: boolean;
}

export type UserBonusProgress = UserProgress & {
    leadin: string;
    parts: string[];
    answers: string[];
    results: QuestionResult[];
}

export type UserTossupProgress = UserProgress & {
    buzzed: boolean;
    questionParts: string[];
    answer: string;
}

export const getTossupParts = (questionText: string) => {
    const regex = /\|\|([^|]+)\|\|/g;
    const matches = [];
    let match;

    while ((match = regex.exec(questionText)) !== null) {
        matches.push(match[1]);
    }

    return matches;
}

export const getEmbeddedMessage = (message: string, silent: boolean = false): MessageCreateOptions => {
    return {
        embeds: [
            new EmbedBuilder().setDescription(message)
        ],
        flags: silent ? [MessageFlags.SuppressNotifications] : undefined
    };
}

export const getSilentMessage = (message: string): MessageCreateOptions => {
    return {
        content: message,
        flags: [MessageFlags.SuppressNotifications]
    };
}

type BonusPart = {
    part: number;
    answer: string;
    difficulty: nullableString;
}

export const saveTossup = (questionId: string, serverId: string, authorId: string, totalCharacters: number, category: string, answer: string, key: nullableString) => {
    insertTossupCommand.run(questionId, serverId, authorId, totalCharacters, category, encrypt(answer, key));
}

export const saveBonus = (questionId: string, serverId: string, authorId: string, category: string, parts: BonusPart[], key: nullableString) => {
    insertBonusCommand.run(questionId, serverId, authorId, category);

    for (var { part, difficulty, answer } of parts) {
        insertBonusPartCommand.run(questionId, part, difficulty, encrypt(answer, key));
    }
}

export const saveBuzz = (serverId: string, questionId: string, authorId: string, userId: string, clue_index: number, characters_revealed: number, value: number, answerGiven: nullableString, key: nullableString) => {
    insertBuzzCommand.run(serverId, questionId, authorId, userId, clue_index, characters_revealed, value, answerGiven ? encrypt(answerGiven, key) : null);
}

export const saveBonusDirect = (serverId: string, questionId: string, authorId: string, userId: string, part: number, value: number, answerGiven: nullableString, key: nullableString) => {
    insertBonusDirectCommand.run(serverId, questionId, authorId, userId, part, value, answerGiven ? encrypt(answerGiven, key) : null);
}

export const saveServerChannelsFromMessage = (collected: Collection<string, Message<boolean>>, server: Guild) => {
    let tags = collected?.first()?.content.split(' ') || [];

    deleteServerChannelsCommand.run(server.id);

    tags.forEach((tag) => {
        const [_, channelId, resultsChannelId] = tag.match(/<#(\d+)>\/<#(\d+)>/) || [];
        const channel = server.channels.cache.find((channel) => channel.id === channelId)?.id;
        const resultsChannel = server.channels.cache.find((channel) => channel.id === channelId)?.id;

        if (channel && resultsChannel) {
            insertServerChannelCommand.run(server.id, channelId, resultsChannelId);
        }
    });
}

export const getServerChannels = (serverId: string) => {
    return getServerChannelsQuery.all(serverId) as ServerChannel[];
}

export const updateThreadId = (questionId: string, questionType: QuestionType, threadId: string) => {
    if (questionType === QuestionType.Bonus)
        updateBonusThreadCommand.run(threadId, questionId);
    else
        updateTossupThreadCommand.run(threadId, questionId);
}

export const getThreadId = (questionId: string, questionType: QuestionType) => {
    if (questionType === QuestionType.Bonus)
        return (getBonusThreadQuery.get(questionId) as any).thread_id;
    else
        return (getTossupThreadQuery.get(questionId) as any).thread_id;
}

export const getThreadAndUpdateSummary = async (userProgress: UserProgress, threadName: string, channel: TextChannel) => {
    const threadId = getThreadId(userProgress.questionId, userProgress.type);
    let thread;

    if (!threadId) {
        thread = await channel.threads.create({
            name: threadName,
            autoArchiveDuration: 60
        });
        updateThreadId(userProgress.questionId, userProgress.type, thread.id);

        if (userProgress.type === QuestionType.Tossup)
            thread.send(getTossupSummary(userProgress.questionId, (userProgress as UserTossupProgress).questionParts));
        else
            thread.send(getBonusSummary(userProgress.questionId));
    } else {
        thread = channel.threads.cache.find(x => x.id === threadId);
        const resultsMessage = (await thread!.messages.fetch()).find(m => m.content.includes("## Results"));

        if (resultsMessage) {
            if (userProgress.type === QuestionType.Tossup)
                resultsMessage.edit(getTossupSummary(userProgress.questionId, (userProgress as UserTossupProgress).questionParts));
            else
                resultsMessage.edit(getBonusSummary(userProgress.questionId));

        }
    }

    return thread!;
}

export const getTossupSummary = (questionId: string, questionParts: string[]) => {
    const buzzes = getTossupBuzzesQuery.all(questionId) as any[];
    const gets = buzzes.filter(b => b.value > 0);
    const negs = buzzes.filter(b => b.value <= 0);
    const groupedBuzzes = listify(group(buzzes, b => b.clue_index), (key, value) => ({
        index: parseInt(key),
        buzzes: value
    }));
    const totalCharacters = questionParts.join('').length;
    let buzzSummaries:string[] = [];

    for (let buzzpoint of groupedBuzzes) {
        let cumulativeCharacters = questionParts.slice(0, buzzpoint.index + 1).join('').length;
        let correctBuzzes = buzzpoint.buzzes?.filter(b => b.value > 0)?.length || 0;
        let incorrectBuzzes = buzzpoint.buzzes?.filter(b => b.value <= 0)?.length || 0;

        buzzSummaries.push(`${correctBuzzes} correct buzz${correctBuzzes !== 1 ? "es" : ""}, ${incorrectBuzzes} incorrect buzz${incorrectBuzzes !== 1 ? "es" : ""} at ${formatPercent(cumulativeCharacters / totalCharacters, 0)} mark (clue: ||${questionParts[buzzpoint.index].substring(0, 30)}||)`)
    }

    return `## Results\n` +
        `${buzzSummaries.join('\n')}\n` +
        `**Played:** ${buzzes.length}\t**Conv. %**: ${formatPercent(gets.length / buzzes.length)}\t**Neg %**: ${formatPercent(negs.length / buzzes.length)}\t**Avg. Buzz**: ${formatDecimal(sum(gets, b => b.characters_revealed) / gets.length)}`;
}

export const getBonusSummary = (questionId: string) => {
    const bonusSummary = getBonusSummaryData(questionId) as any;

    return `## Results\n**Total Plays**: ${bonusSummary.total_plays}\tPPB: ${bonusSummary.ppb.toFixed(2)}\tEasy %: ${formatPercent(bonusSummary.easy_conversion)}\tMedium %: ${formatPercent(bonusSummary.medium_conversion)}\tHard %: ${formatPercent(bonusSummary.hard_conversion)}`
}