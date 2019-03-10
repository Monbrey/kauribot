const BaseCommand = require("./base")
const request = require("request-promise-native")

const clean = text => {
    if (typeof (text) === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203))
    else
        return text
}

module.exports = class EvalCommand extends BaseCommand {
    constructor() {
        super({
            name: "eval",
            aliases: ["e"],
            description: "Runs Javascript and returns the result",
            enabled: true,
            defaultConfig: { "guild": false },
            lockedConfig:  {
                "global": true
            },
            requiresOwner: true
        })
    }

    async run(message, args = [], flags = []) {
        try {
            const code = args.join(" ")
            let evaled = await eval(code)

            if(!evaled) return message.channel.sendPopup("info", "No return value")

            if (!flags.includes("s")) {
                if (evaled.length >= 2000) {
                    try {
                        const { key } = await request.post("https://hasteb.in/documents", {
                            body: evaled,
                            json: true
                        })
                        message.channel.sendPopup("info", `Return value too long: uploaded to https://hasteb.in/${key}.js`)
                    } catch (e) {
                        return message.channel.sendPopup("error", "Response too long, and hasteb.in appears to be down. Unable to post return value")
                    }
                } else {
                    if (typeof evaled !== "string")
                        evaled = require("util").inspect(evaled)
                    message.channel.send(clean(evaled), { code: "xl" })
                }
            }
        } catch (e) {
            message.client.logger.parseError(e, this.name)
        }
    }
}