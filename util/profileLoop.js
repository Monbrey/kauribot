module.exports = async (message, profile, member, trainer, lastReaction = null) => {
    if (lastReaction) await profile.clearReactions()

    let pokeball = profile.client.emojis.find(e => e.name === "pokeball" && message.client.emojiServers.includes(e.guild.id))
    let backpack = profile.client.emojis.find(e => e.name === "backpack" && message.client.emojiServers.includes(e.guild.id))
    let red = profile.client.emojis.find(e => e.name === "red" && message.client.emojiServers.includes(e.guild.id))

    try {
        switch (lastReaction) {
            case "pokeball":
                profile = await profile.edit(await message.client.commands.get("roster").roster(member, trainer))
                await profile.react(red)
                await profile.react(backpack)
                break
            case "backpack":
                profile = await profile.edit(await message.client.commands.get("inventory").inventory(member, trainer))
                await profile.react(red)
                await profile.react(pokeball)
                break
            case "red":
                profile = await profile.edit(await message.client.commands.get("trainer").profile(member, trainer))
                await profile.react(pokeball)
                await profile.react(backpack)
                if (message.member === member) await profile.react("📝")
                break
            case "📝":
                profile = await profile.edit(await message.client.commands.get("trainer").editProfile(member, trainer))
                await profile.react(red)
                break
        }
    } catch (e) {
        message.client.logger.parseError(e, "profileLoop")
        return message.channel.sendPopup("error", "An error occured while displaying profile data")
    }

    let filter = (reaction, user) => user.id === message.author.id && ["red", "backpack", "pokeball", "📝"].includes(reaction.emoji.name)

    let reactions = await profile.awaitReactions(filter, {
        max: 1,
        time: 30000
    })

    if (!reactions.first()) return profile.clearReactions()

    return module.exports(message, profile, member, trainer, reactions.first().emoji.name)
}