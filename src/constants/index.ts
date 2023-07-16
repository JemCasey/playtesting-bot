export const TOSSUP_REGEX = /(.*)\nANSWER:(.*)(?:\n?.*?\n<(.*), \w+>)?/;
export const BONUS_REGEX = /(.+)\n(.+)\nANSWER:(.+)\n(.+)\nANSWER:(.+)\n(.+)\nANSWER:(.+)(?:\n?.*?\n<(.*), \w+>)?/;
export const BONUS_DIFFICULTY_REGEX = /.*\[10(?:\|\|)?(\w{1})(?:\|\|)?\].*/;
export const SECRET_ROLE = "secret";