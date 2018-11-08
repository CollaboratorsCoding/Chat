const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const storeSchema = new mongoose.Schema({
	author: String,
	message: String,
	date: {
		type: Date,
		default: Date.now(),
	},
	color: String,
	room: String,
	participants: [String],
});

module.exports = mongoose.model('Message', storeSchema);
