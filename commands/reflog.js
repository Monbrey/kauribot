const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const Trainer = require("../models/trainer")

module.exports = class RefLogCommand extends BaseCommand {
    constructor() {
        super({
            name: "reflog",
            aliases: ["rl"],
            description: "Awards cash to battlers and ref",
            usage: "!reflog @winner @loser <size> [-gym] <description/logURL>",
            enabled: true,
            defaultConfig: false,
            guildOnly: true
        })
    }

    async run(message, args = [], flags = []) {
        //Check that the user has the ref role
        if(!message.member.roles.find(r => ["referee","senior-referee"].includes(r.name)))
            return message.channel.send("!reflog can only be used by referees")

        //Check that two mentions are included
        if (message.mentions.members.size != 2)
            return message.channel.send("This command requires that two battlers (winner/loser) be mentioned.")

        //Extract the arguments into named variables
        let battlers = args.filter(arg => arg.startsWith("<@")).map(arg => arg.replace(/[<@!>]/g, ""))
        let battleCode = args.find(arg => !arg.startsWith("<@"))
        battleCode = battleCode.indexOf("v") == 1 ? battleCode[0] : battleCode
        let description = args.slice(3).join(" ")

        let winner = message.mentions.members.get(battlers[0])
        let loser = message.mentions.members.get(battlers[1])
        let ref = message.member
        //Check that the ref isnt also a battler
        if ([winner.id, loser.id].includes(ref.user.id)) return message.channel.send("Illegal command usage - referee cannot also be a battler.")

        if (!await Trainer.discordIdExists(winner.id)) return message.channel.send(`Could not find a URPG Trainer for ${winner}`)
        if (!await Trainer.discordIdExists(loser.id)) return message.channel.send(`Could not find a URPG Trainer for ${loser}`)
        if (!await Trainer.discordIdExists(ref.id)) return message.channel.send(`Could not find a URPG Trainer for ${ref}`)

        let payments
        switch (battleCode) {
        default:
            return message.channel.send(`\`${battleCode}\` is not a valid battle size. Battle size must be between 2 and 6`)
        case "2":
        case "2v2":
            if (!flags.includes("gym")) {
                payments = [1000, 500, 1000]
                break
            } else return message.channel.send(`\`${battleCode}\` is not a valid gym battle size. Battle size must be between 3 and 6`)
        case "3":
        case "3v3":
            payments = [1500, 500, 1500]
            break
        case "4":
        case "4v4":
            payments = [2500, 1000, 2000]
            break
        case "5":
        case "5v5":
            payments = [3500, 1500, 2500]
            break
        case "6":
        case "6v6":
            payments = [5000, 2500, 4000]
            break
        }

        if (flags.includes("gym")) payments[0] += 500

        let embed = new RichEmbed()
            .setTitle(`${battleCode}v${battleCode}${flags.includes("gym") ? " Gym" : ""} Battle`)
            .setColor(parseInt("1f8b4c", 16))
            .setDescription(`Please react to confirm the payments below:

**${winner.nickname || winner.user.username}** : +$${payments[0]} (win)
**${loser.nickname || loser.user.username}** : +$${payments[1]} (lose)

**${ref.nickname || ref.user.username}** : +$${payments[2]} (ref)`)

        let prompt = await message.channel.send(embed)

        if (await prompt.reactConfirm(message.author.id)) {
            let winnerCash = await Trainer.modifyCash(winner.id, payments[0])
            let loserCash = await Trainer.modifyCash(loser.id, payments[1])
            let refCash = await Trainer.modifyCash(ref.id, payments[2])

            embed.fields = []
            embed.setTitle("Battle payments confirmed")
                .setColor(parseInt("1f8b4c", 16))
                .setDescription(`New cash balances:

**${winner.nickname || winner.user.username}** : $${winnerCash}
**${loser.nickname || loser.user.username}** : $${loserCash}         
**${ref.nickname || ref.user.username}** : $${refCash}`)
        } else await prompt.delete()

        await message.channel.send(embed)
        return message.client.logger.reflog(message, prompt) 
    }
}