const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const storeSchema = new mongoose.Schema({
	author: String,
	message: String,
	date: String,
	id: String,
	color: String,
	image: String,
});

module.exports = mongoose.model('Message', storeSchema);
