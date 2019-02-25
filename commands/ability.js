const BaseCommand = require("./base")
const Ability = require("../models/ability")

module.exports = class AbilityCommand extends BaseCommand {
    constructor() {
        super({
            name: "ability",
            category: "Info",
            description: "Provides information on Pokemon Abilities",
            usage: "!ability <Ability>",
            enabled: true,
            defaultConfig: true,
            examples: [
                "!ability Overgrow",
                "!ability Blaze",
                "!ability Torrent"
            ]
        })
    }

    async run(message, args = [], flags = []) {
        if (args.length === 0) {
            return this.getHelp(true)
        }

        let query = args.join(" ")
        let ability = await Ability.findClosest(query)
        if (ability) {
            message.client.logger.info({ key: "ability", search: query, result: ability.abilityName })
            return message.channel.send(ability.info())
        } else {
            message.client.logger.info({ key: "ability", search: query, result: "none" })
            return message.channel.send(`No results found for ${query}`)
        }
    }
}