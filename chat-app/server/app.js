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
	if (
		sockets_data.connections.filter(
			user => user.username === socket.handshake.query.username
		).length
	) {
		sockets_data.connections.map(user => {
			return user.username === socket.handshake.query.username
				? {
						socketInstance: socket,
						color: socket.handshake.query.color,
						username: socket.handshake.query.username,
				  }
				: user;
		});
	} else {
		sockets_data.connections.push({
			socketInstance: socket,
			color: socket.handshake.query.color,
			username: socket.handshake.query.username,
		});
	}
	console.log(sockets_data.connections);
	socket.join('global');
	Message.find({ room: 'global' })
		.sort({ date: 1 })
		.then(function(messages) {
			socket.emit('initial_data', {
				messages,
				online: sockets_data.connections.map(data => ({
					...data,
					socketInstance: undefined,
				})),
			});
			socket.broadcast.emit('user_connected', {
				online: sockets_data.connections.map(data => ({
					...data,
					socketInstance: undefined,
				})),
			});
		});

	socket.on('disconnect', () => {
		sockets_data.connections = sockets_data.connections.filter(
			connection => connection.socketInstance.id !== socket.id
		);
		io.emit('user_disconnected', {
			online: sockets_data.connections.map(data => ({
				...data,
				socketInstance: undefined,
			})),
		});
	});

	socket.on('user_send_message', function(data, callback) {
		const message = new Message(data);
		message.save(function(err, created_message) {
			if (err) {
				console.log(err);
			} else {
				if (created_message.participants.length > 0) {
					const from = created_message.participants[0];
					const to = created_message.participants[1];
					const recipientSocket = sockets_data.connections.filter(
						connection => connection.username === from
					)[0].socketInstance;
					recipientSocket.join(created_message.room);

					Message.find({ participants: { $all: [to, from] } })
						.sort({ date: 1 })
						.then(function(messages) {
							const online = sockets_data.connections
								.filter(instance => {
									if (
										instance.username === from ||
										instance.username === to
									) {
										return true;
									}
									return false;
								})
								.map(user => ({
									username: user.username,
									color: user.color,
								}));
							console.log(sockets_data.connections, online);
							io.in(created_message.room).emit(
								'recieve_message',
								{
									visibleName: from,
									message: created_message,
									messages,
									online,
								}
							);
							callback();
						});
				} else {
					io.in(created_message.room).emit('recieve_message', {
						message: created_message,
						online: sockets_data.connections.map(data => ({
							...data,
							socketInstance: undefined,
						})),
					});
					callback();
				}
			}
		});
	});
	let n = 1;
	socket.on('room_join', ({ to, from }, callback) => {
		const roomName = `room${n}`;
		socket.join(roomName);
		n = n + 1;
		Message.find({ participants: { $all: [to, from] } })
			.sort({ date: 1 })
			.then(function(messages) {
				callback({
					messages,
					roomName,
				});
			});
	});
});
server.listen(8080, function() {
	console.log('server is running on port 8080');
});