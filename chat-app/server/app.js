const express = require('express');
const app = express();
const server = require('http').Server(app);
const socket = require('socket.io');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const morgan = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');

app.use(
	morgan(
		'[:date[clf]] ":method :url HTTP/:http-version" :status  :response-time ms'
	)
);

app.use(express.static(path.resolve(__dirname, '..', 'build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('./models').connect(
	'mongodb://admin:admin@ds115546.mlab.com:15546/chat-logs'
);

app.get('*', (req, res) => {
	res.sendFile(path.resolve(__dirname, '..', 'build', 'index.html'));
});

io = socket(server);

const sockets_data = {
	connections: [],
};

io.on('connection', socket => {
	sockets_data.connections.push({
		id: socket.id,
		color: socket.handshake.query.color,
		username: socket.handshake.query.username,
	});
	Message.find({})
		.sort({ date: 1 })
		.then(function(messages) {
			socket.emit('initial_data', {
				messages,
				online: sockets_data.connections,
			});
			socket.broadcast.emit('user_connected', {
				online: sockets_data.connections,
			});
		});

	socket.on('disconnect', () => {
		sockets_data.connections = sockets_data.connections.filter(
			connection => connection.id !== socket.id
		);
		io.emit('user_disconnected', {
			online: sockets_data.connections,
		});
	});

	socket.on('user_send_global_message', function(data, callback) {
		console.log(data);
		const message = new Message(data);
		message.save(function(err, created_message) {
			if (err) {
				console.log(err);
			} else {
				callback();
				io.emit('recieve_global_message', created_message);
			}
		});
	});
});
server.listen(8080, function() {
	console.log('server is running on port 8080');
});
