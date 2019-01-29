const BaseEvent = require("./base")
const { oneLineCommaListsAnd } = require("common-tags")

module.exports = class MessageEvent extends BaseEvent {
    constructor() {
        super({
            name: "message",
            enabled: true
        })
    }

    async run(message) {
        // Ignore messages from bots
        if (message.author.bot) return
        // Ignore messages that don't start with the prefix
        if (!message.content.startsWith(message.client.prefix)) return

        //Determine the location of the message, a server or a DM
        message.location = message.guild ? `${message.guild.name} #${message.channel.name}` : "DM"
        //Log the message
        message.client.logger.info(`${message.author.username} in ${message.location}: ${message.content}`, {
            key: "message"
        })

        //Parse CSV's with spaces as a single argument
        let content = message.content.replace(/, +/g, ",")
        //Split the args on spaces
        let _args = content.slice(message.client.prefix.length).trim().split(/ +/g)
        //Pull the command the array
        let carg = _args.shift().toLowerCase()

        //Get the matching command class
        let command = message.client.commands.get(carg) || message.client.commands.get(message.client.aliases.get(carg))
        if (!command) return

        let [flags, args] = await super.argsplit(_args)

        //Intercept help flags as they aren't command-specific
        if (flags.includes("h")) return command.getHelp(message.channel)
        
        //If its the bot owner, run the command now without further checks
        if (message.author.id === message.client.applicationInfo.owner.id)
            return command.run(message, args, flags)

        //Check if its an owner-only command, don't run if it is We already ran 
        if (command.requiresOwner) return

        //Check that the command is enabled in this channel/server
        if (command.config.channels.get(message.channel.id) === undefined) {
            if (command.config.guilds.get(message.guild.id) === undefined)
                return message.channel.send(`${this.prefix}${command.name} has not been configured for use in this server`)
            if (!command.config.guilds.get(message.guild.id))
                return message.channel.send(`${this.prefix}${command.name} has been disabled on this server`)
        } else if (!command.config.channels.get(message.channel.id)) {
            return message.channel.send(`${this.prefix}${command.name} has been disabled in this channel`)
        }
        //If we reach this point, it should be enabled

        //Check if a guild-only command is being run in DM
        if (command.guildOnly && message.channel.type == "dm") return

        //Check if the command requires Discord permissions
        let permissions = command.requiresPermission ?
            message.channel.memberPermissions(message.member).has(command.requiresPermission, true) :
            true

        //Or particular Discord roles
        let roles = command.requiresRole ?
            message.member.roles.some(role => command.requiresRole.includes(role.name)) :
            true

        if (permissions && roles)
            return command.run(message, args, flags)
        if (!permissions)
            return message.channel.send("You don't have the required server/channel permissions to use this command.")
        if (!roles)
            return message.channel.send(oneLineCommaListsAnd `This command can only be used by ${command.requiresRole}`)
    }
}