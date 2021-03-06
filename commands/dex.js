const BaseCommand = require('./base')
const { RichEmbed } = require('discord.js')
const Pokemon = require('../models/pokemon')

module.exports = class DexCommand extends BaseCommand {
    constructor() {
        super({
            name: 'dex',
            category: 'Info',
            description: 'Get Ultradex data for a Pokemon',
            syntax: '!dex <Pokemon>',
            args: { query: { type: 'String' } },
            enabled: true
        })
    }

    async prompt(dex) {
        // Set the default filter
        let filter = (reaction, user) =>
            ['🇲'].includes(reaction.emoji.name) && user.id === dex.orig_author.id
        await dex.react('🇲')

        // One mega override
        if (dex.pokemon.mega.length == 1) {
            await dex.react('🇽')
            filter = (reaction, user) =>
                ['🇲', '🇽'].includes(reaction.emoji.name) && user.id === dex.orig_author.id
        }
        // Two mega override
        if (dex.pokemon.mega.length == 2) {
            await dex.react('🇽')
            await dex.react('🇾')
            filter = (reaction, user) =>
                ['🇲', '🇽', '🇾'].includes(reaction.emoji.name) && user.id === dex.orig_author.id
        }
        // Primal override
        if (dex.pokemon.primal.length == 1) {
            await dex.react('🇵')
            filter = (reaction, user) =>
                ['🇲', '🇵'].includes(reaction.emoji.name) && user.id === dex.orig_author.id
        }

        let response = await dex.awaitReactions(filter, { max: 1, time: 30000 })

        if (response.size > 0) {
            // Otherwise proceed through the workflow
            switch (response.first().emoji.name) {
                case '🇲':
                    await dex.edit(dex.pokemon.learnset(dex))
                    break
                case '🇽':
                    await dex.edit(await dex.pokemon.megaDex(0))
                    break
                case '🇾':
                    await dex.edit(await dex.pokemon.megaDex(1))
                    break
                case '🇵':
                    await dex.edit(await dex.pokemon.primalDex(0))
                    break
            }
        } else {
            let embed = new RichEmbed(dex.embeds[0])
            embed.setFooter('')
            await dex.edit(embed)
        }

        return dex.clearReactions()
    }

    async run(message, args = []) {
        if (args.size === 0) {
            return this.getHelp(message.channel)
        }

        try {
            const search = args.get('query')
            const fields = '-__v -speciesName -uniqueName -starterEligible'
            const { query, rating } = await Pokemon.findClosest('uniqueName', search)
            const pokemon = await query.select(fields).cache(300)
            pokemon.matchRating = rating

            if (pokemon) {
                message.client.logger.info({
                    key: 'dex',
                    search,
                    result: pokemon.uniqueName
                })
                let dex = await message.channel.send(await pokemon.dex(search))
                dex.pokemon = pokemon
                dex.orig_author = message.author

                return this.prompt(dex)
            } else {
                message.client.logger.info({ key: 'dex', search, result: 'none' })
                return message.channel.sendPopup('warn', `No results found for ${search}`)
            }
        } catch (e) {
            e.key = 'dex'
            throw e
        }
    }
}
