const { RichEmbed } = require("discord.js")
const Pokemon = require("../../models/pokemon")

const browsePokemon = async (message, page = 1, sentMessage = null) => {
    let items = await Pokemon.getMartPokemon(page)

    let embed = new RichEmbed()
        .setTitle(`URPG Pokemart | Pokemon Catalogue | Balance: $${message.trainer.cash.toLocaleString()}`)
        .setDescription(`Click the arrows to browse pages
Use \`!buy pokemon [<Pokemon>, <Pokemon>...]\` to make a purchase`)
        .setFooter(`Page ${page} of ${items.pages}`)

    items.docs.forEach(item => embed.addField(item.uniqueName, `$${item.martPrice.pokemart.toLocaleString()}`, true))

    while (embed.fields.length % 3 != 0) embed.addBlankField(true)

    sentMessage = sentMessage ? await sentMessage.edit(embed) : await message.channel.send(embed)

    try {
        let next = await sentMessage.reactPaginator(message.author.id, items.prev, items.next)

        if(next === null) return

        if (next === true) return await browsePokemon(message, page + 1, sentMessage)
        if (next === false) return await browsePokemon(message, page - 1, sentMessage)
    } catch (e) {
        message.client.logger.parseError(e, "mart")
        return message.channel.sendPopup("error", "Error encountered while displaying Pokemart catalogue")
    }
}

module.exports = browsePokemon