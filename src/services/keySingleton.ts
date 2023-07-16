import { Message } from "discord.js";
import { SECRET_ROLE } from "src/constants";
import crypto from 'crypto';

class KeySingleton {
    keyMap:any;
    static instance: KeySingleton;

    constructor() {
        this.keyMap = new Map();
    }

    getKey(message:Message<boolean>) {
        if (!message.guild)
            return null;

        if (this.keyMap.has(message.guild.id))
            return this.keyMap.get(message.guild.id);

        
        let role = message.guild.roles.cache.find(r => r.name === SECRET_ROLE);
        let key = null;
        
        if (role) {
            key = crypto.createHash('sha512').update(String(role.id)).digest('hex').substring(0, 32);
        }

        this.keyMap.set(message.guild.id, key);

        return key;
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new KeySingleton();
        }

        return this.instance;
    }
}

export default KeySingleton;