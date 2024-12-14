import { Client, GatewayIntentBits, Partials, ChannelType, Interaction, TextChannel } from 'discord.js';
import { config } from "./config";
import handleTossupPlaytest from './handlers/tossupHandler';
import handleBonusPlaytest from './handlers/bonusHandler';
import handleNewQuestion from './handlers/newQuestionHandler';
import handleConfig from './handlers/configHandler';
import handleButtonClick from './handlers/buttonClickHandler';
import handleCategoryCommand from './handlers/categoryCommandHandler';
import { QuestionType, UserBonusProgress, UserProgress, UserTossupProgress, getServerChannels, serverSettings, setPacketName } from './utils';
import handleAuthorCommand from './handlers/authorCommandHandler';

const userProgressMap = new Map<string, UserProgress>();

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Channel,
        Partials.Message
    ],
    allowedMentions: {
        parse: []
    }
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

client.on('messageCreate', async (message) => {
    try {
        if (message.author.id === config.DISCORD_APPLICATION_ID)
            return;

        if (message.content.startsWith('!config')) {
            await handleConfig(message);
        } else if (message.content.startsWith("!packet") || message.content.startsWith("!round") || message.content.startsWith("!read")) {
            let thisServerSetting = serverSettings.find(ss => ss.serverId == message.guild!.id);
            let splits = message.content.split(" ");
            if (splits.length > 1) {
                let desiredPacketName = splits.slice(-1)[0];
                if (desiredPacketName) {
                    if (desiredPacketName.includes("reset") || desiredPacketName.includes("clear")) {
                        setPacketName(message.guild!.id, "");
                        message.reply("Packet cleared.");
                    } else {
                        setPacketName(message.guild!.id, desiredPacketName);
                        message.reply(`Now reading packet ${thisServerSetting?.packetName}.`);
                        const echoChannelId = getServerChannels(message.guild!.id).find(c => (c.channel_type === 3))?.channel_id;
                        if (echoChannelId) {
                            const echoChannel = (client.channels.cache.get(echoChannelId) as TextChannel);
                            echoChannel.send(`# Packet ${thisServerSetting?.packetName}`);
                        }
                    }
                } else {
                    if (message.content.startsWith("!packet") || message.content.startsWith("!round")) {
                        if (thisServerSetting?.packetName) {
                            message.reply(`The current packet is ${thisServerSetting?.packetName}.`);
                        } else {
                            message.reply("Packet not configured yet.");
                        }
                    }
                }
            } else {
                if (message.content.startsWith("!packet") || message.content.startsWith("!round")) {
                    if (thisServerSetting?.packetName) {
                        message.reply(`The current packet is ${thisServerSetting?.packetName}.`);
                    } else {
                        message.reply("Packet not configured yet.");
                    }
                }
            }
        } else if (message.content.startsWith('!category')) {
            await handleCategoryCommand(message);
        } else if (message.content.startsWith('!author')) {
            await handleAuthorCommand(message);
        } else {
            let setUserProgress = userProgressMap.set.bind(userProgressMap);
            let deleteUserProgress = userProgressMap.delete.bind(userProgressMap);

            if (message.channel.type !== ChannelType.DM && message.content.includes('ANSWER:')) {
                await handleNewQuestion(message);
            } else if (message.channel.type === ChannelType.DM) {
                let userProgress = userProgressMap.get(message.author.id)

                if (userProgress?.type === QuestionType.Tossup) {
                    await handleTossupPlaytest(message, client, userProgress as UserTossupProgress, setUserProgress, deleteUserProgress);
                } else if (userProgress?.type === QuestionType.Bonus) {
                    await handleBonusPlaytest(message, client, userProgress as UserBonusProgress, setUserProgress, deleteUserProgress);
                }
            }
        }
    } catch (e) {
        console.log(e);
    }
});

client.on('interactionCreate', async (interaction: Interaction) => {
    try {
        await handleButtonClick(interaction, userProgressMap, userProgressMap.set.bind(userProgressMap));
    } catch (e) {
        console.log(e);
    }
});

client.login(config.DISCORD_TOKEN);
