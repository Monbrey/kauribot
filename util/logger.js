const { RichEmbed } = require("discord.js")
const { transports, format, createLogger } = require("winston")
const { Loggly } = require("winston-loggly-bulk")

const _logFormat = format.combine(
    format.label({
        label: process.env.NODE_ENV
    }),
    format.timestamp(),
    format.json(),
    format.colorize(),
    format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
)

const _transports = [
    new Loggly({
        token: "e4331153-6ed4-44f4-a2aa-b03c967a4d66",
        subdomain: "monbrey",
        tags: ["Winston-NodeJS"],
        json: true
    }),
    new transports.Console()
]

if (process.env.NODE_ENV === "production") {
    _transports.push(
        new transports.File({
            filename: "./ultra-rpg-bot.log"
        }),
        new transports.File({
            filename: "./ultra-rpg-bot-errors.log",
            level: "error"
        })
    )
}

module.exports = class Logger {
    constructor() {
        Object.assign(this, createLogger({
            level: "info",
            format: _logFormat,
            transports: _transports
        }))
    }

    async newStarter(message, trainer, starter) {
        this.info(`New trainer ${trainer.username} (${trainer.discord_id}) registered`, {
            key: "start"
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter("New trainer started")
            .setTimestamp()
            .setDescription(`New trainer ${trainer.username} (${message.author.tag}) started with ${starter.displayName}`)

        return message.guild.logChannel.send(embed)
    }

    async refLog(message, log) {
        this.info(`${message.author.tag} logged a battle: ${log.url}`, {
            key: "refLog"
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter("Battle logged")
            .setColor(parseInt("1f8b4c", 16))
            .setDescription(`${message.member} logged a battle in [${log.channel}](${log.url})`)
            .setTimestamp()

        return message.guild.logChannel.send(embed)
    }

    async messageDelete(message, auditLog) {
        let member = message.member
        let memberTag = message.author.tag
        let channel = message.channel
        let channelName = message.channel.name
        let guildName = message.guild.name
        let executor = auditLog ? auditLog.executor : "Author or bot"
        let executorTag = auditLog ? executor.tag : "Author or bot"

        this.info(`A message by ${memberTag} in ${guildName}#${channelName} was deleted by ${executorTag}: ${message.cleanContent}`, {
            key: "messageDelete"
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter("Message deleted")
            .addField("Author", member, true)
            .addField("Channel", channel, true)
            .addField("Deleted by", executor, true)

        if (message.content) embed.addField("Content", message.cleanContent)
        if (message.attachments[0]) embed.addField("Image", message.attachments[0].url)

        try {
            if (message.embeds[0]) {
                embed.addField("Embed", "`See below`")
                await message.guild.logChannel.send(embed)
                return message.guild.logChannel.send(new RichEmbed(message.embeds[0]))
            } else return message.guild.logChannel.send(embed)
        } catch (e) {
            this.error(e.stack)
        }
    }

    async prune(message, numDeleted) {
        this.info(`${message.author.tag} deleted ${numDeleted} messages from ${message.guild.name}#${message.channel.name}`, {
            key: "prune"
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter("Messages pruned")
            .addField("Channel", message.channel, true)
            .addField("Deleted by", message.member, true)
            .addField("Number Deleted", numDeleted, true)

        try {
            return message.guild.logChannel.send(embed)
        } catch (e) {
            this.error(e.stack)
        }
    }

    async guildMemberAdd(member) {
        this.info(`${member.user.tag} joined ${member.guild.name}`, {
            key: "guildMemberAdd"
        })

        if (!member.guild.logChannel) return

        let embed = new RichEmbed()
            .setAuthor(`${member.user.tag} (${member.id})`, member.user.avatarURL)
            .setFooter("User joined")
            .setTimestamp()

        return member.guild.logChannel.send(embed)
    }

    async guildMemberRemove(member, auditLog) {
        let executor = auditLog ? auditLog.executor : member
        let executorTag = auditLog ? executor.tag : executor.user.tag

        let embed = new RichEmbed()
            .setAuthor(`${member.user.tag} (${member.id})`, member.user.avatarURL)
            .setTimestamp()

        if (auditLog) { //Was kicked
            this.info(`${member.user.tag} was kicked from ${member.guild.name} by ${executorTag}`, {
                key: "guildMemberRemove"
            })

            embed.setDescription(`Kicked by ${executor}`).setFooter("User kicked")
        } else {
            this.info(`${member.user.tag} left ${member.guild.name}`, {
                key: "guildMemberRemove"
            })
            embed.setFooter("User left")
        }

        if (member.guild.logChannel) return member.guild.logChannel.send(embed)
    }
}