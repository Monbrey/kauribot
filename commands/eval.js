const BaseCommand = require("./base")

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
            defaultConfig: false,
            lockConfig: true,
            requiresOwner: true
        })
    }

    async run(message, args = [], flags = [], command = "eval") {
        try {
            const code = args.join(" ")
            let evaled = await eval(code)

            if (!flags.includes("s")) {
                if (typeof evaled !== "string")
                    evaled = require("util").inspect(evaled)

                message.channel.send(clean(evaled), { code: "xl" })
            }
        } catch (e) {
            message.client.logger.error(e.stack, { key: "eval" })
        }
    }
}