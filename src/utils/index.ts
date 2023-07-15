import { Collection, EmbedBuilder, Guild, Message } from "discord.js";
import Database from 'better-sqlite3';

const db = new Database('database.db');

const deleteServerChannelsCommand = db.prepare('DELETE FROM server_channel WHERE server_id = ? AND type = ?');
const insertServerChannelCommand = db.prepare('INSERT INTO server_channel (server_id, channel_id, type) VALUES (?, ?, ?)');
const getServerChannelsQuery = db.prepare('SELECT * FROM server_channel WHERE server_id = ? AND type = ?');
const insertBuzzCommand = db.prepare('INSERT INTO buzz (server_id, question_id, author_id, user_id, clue_index, value, answer_given) VALUES (?, ?, ?, ?, ?, ?, ?)');
const insertBonusDirectCommand = db.prepare('INSERT INTO bonus_direct (server_id, question_id, author_id, user_id, part, value, answer_given) VALUES (?, ?, ?, ?, ?, ?, ?)');

export const removeSpoilers = (text: string) => text.replaceAll('||', '');
export const shortenAnswerline = (answerline: string) => removeSpoilers(answerline.replace(/ \[.+\]/, '').replace(/ \(.+\)/, '')).trim();
export const removeBonusValue = (bonusPart: string) => bonusPart.replace(/\|{0,2}\[10\|{0,2}[emh]?\|{0,2}]\|{0,2} ?/, '');

export enum ServerChannelType {
    Playtesting = 1,
    Results
}

export type ServerChannel = {
    server_id: string;
    channel_id: string;
    type: ServerChannelType;
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

export const getEmbeddedMessage = (message:string) => {
    return {
        embeds: [
            new EmbedBuilder().setDescription(message)
        ]
    };
}

export const saveBuzz = (serverId: string, questionId: string, authorId: string, userId: string, clue_index: number, value: number, answerGiven: string | null) => {
    insertBuzzCommand.run(serverId, questionId, authorId, userId, clue_index, value, answerGiven);
}

export const saveBonusDirect = (serverId: string, questionId: string, authorId: string, userId: string, part: number, value: number, answerGiven: string | null) => {
    insertBonusDirectCommand.run(serverId, questionId, authorId, userId, part, value, answerGiven);
}

export const saveServerChannelsFromMessage = (collected: Collection<string, Message<boolean>>, server: Guild, serverChannelType: ServerChannelType) => {
    const tags = collected?.first()?.content.split(' ') || [];

    deleteServerChannelsCommand.run(server.id, serverChannelType);

    tags.forEach((tag) => {
        const channelId = tag.match(/<#(\d+)>/)?.at(1);
        const channel = server.channels.cache.find((channel) => channel.id === channelId)?.id;

        if (channel) {
            insertServerChannelCommand.run(server.id, channelId, serverChannelType);
        }
    });
}

export const getServerChannels = (serverId: string, serverChannelType: ServerChannelType) => {
    return getServerChannelsQuery.all(serverId, serverChannelType) as ServerChannel[];
}
