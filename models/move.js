const mongoose = require('mongoose')
const { RichEmbed } = require('discord.js')
const Color = require('./color')
const { stripIndents } = require('common-tags')

let moveSchema = new mongoose.Schema(
    {
        moveName: { type: String, required: true },
        moveType: { type: String, reuqired: true },
        desc: { type: String },
        power: { type: Number },
        accuracy: { type: Number },
        pp: { type: Number, required: true },
        category: { type: String, required: true },
        contact: { type: Boolean },
        sheerForce: { type: Boolean },
        substitute: { type: Boolean },
        snatch: { type: Boolean },
        magicCoat: { type: Boolean },
        list: { type: Array },
        additional: { type: String },
        note: { type: String },
        zmove: { type: String },
        metronome: { type: Boolean, default: true },
        tm: {
            number: { type: Number },
            martPrice: {
                pokemart: { type: Number },
                berryStore: { type: Number }
            }
        },
        hm: {
            number: { type: Number },
            martPrice: {
                pokemart: { type: Number },
                berryStore: { type: Number }
            }
        }
    },
    { collection: 'moves' }
)

moveSchema.plugin(require('mongoose-plugin-autoinc').autoIncrement, {
    model: 'Move',
    startAt: 1
})

moveSchema.statics.metronome = async function() {
    let move = await this.aggregate([{ $match: { metronome: true } }, { $sample: { size: 1 } }])

    return new this(move[0])
}

moveSchema.methods.info = async function() {
    const type = `Type: ${this.moveType}`
    const power = `Power: ${this.power ? this.power : '-'}`
    const acc = `Accuracy: ${this.accuracy ? this.accuracy : '-'}`
    const pp = `PP: ${this.pp}`
    const cat = `Category: ${this.category}`
    const contact = this.contact ? 'Makes contact. ' : ''
    const sf = this.sheerForce ? 'Boosted by Sheer Force. ' : ''
    const sub = this.substitute ? 'Bypasses Substitute. ' : ''
    const snatch = this.snatch ? 'Can be Snatched. ' : ''
    const mc = this.magicCoat ? 'Can be reflected by Magic Coat. ' : ''

    const propString = stripIndents`| ${type} | ${power} | ${acc} | ${pp} | ${cat} |

    ${contact}${sf}${sub}${snatch}${mc}`

    const embed = new RichEmbed()
        .setTitle(this.moveName)
        .setDescription(propString)
        .setFooter(this.note || '')
        .setColor(await Color.getColorForType(this.moveType.toLowerCase()))

    if (this.additional) embed.addField('Additional note', this.additional)
    if (this.list && this.list.length != 0) embed.addField('Helpful data', this.list.join('\n'))
    if (this.tm) {
        const tmNum = this.tm.number.toString().padStart(2, 0)
        const tmPrice = this.tm.martPrice.pokemart.toLocaleString()
        embed.addField('TM', `Taught by TM${tmNum} ($${tmPrice})`)
    }
    if (this.zmove) embed.addField('Z-Move', this.zmove)

    return embed
}

module.exports = mongoose.model('Move', moveSchema)
