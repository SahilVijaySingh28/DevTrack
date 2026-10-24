const mongoose = require('mongoose')

const runTransaction = (operation) => mongoose.connection.transaction(operation)

module.exports = runTransaction
