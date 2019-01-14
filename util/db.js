const mongoose = require("mongoose")
const cachegoose = require("cachegoose")
const Logger = require("./logger")

const logger = new Logger()

cachegoose(mongoose, {})

mongoose.Promise = global.Promise
mongoose.connect(process.env.MONGODB_URI, {
    useFindAndModify: false,
    useNewUrlParser: true
})
mongoose.set("useCreateIndex", true)

let db = mongoose.connection

db.on("connected", async () => {
    
})

db.on("error", async (err) => {
    logger.error(`Mongoose default connection error: ${err}`)
})

db.on("disconnected", async () => {
    logger.warn("Mongoose default connection disconnected")
})

module.exports = db
