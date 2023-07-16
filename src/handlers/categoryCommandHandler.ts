import { Message } from "discord.js";
import KeySingleton from "src/services/keySingleton";
import Database from 'better-sqlite3';
import { decrypt } from "src/utils/crypto";

const db = new Database('database.db');

export default function handleCategoryCommand(message:Message<boolean>) {
    const key = KeySingleton.getInstance().getKey(message);
    const getBonusParts = db.prepare('SELECT answer FROM bonus_part');
    const getTossups = db.prepare('SELECT answer FROM tossup');
    const bonusParts:any[] = getBonusParts.all();
    const tossups:any[] = getTossups.all();

    message.reply(bonusParts.map(p => decrypt(p.answer, key)).join('\n') + '\n' + tossups.map(p => decrypt(p.answer, key)).join('\n'));
}