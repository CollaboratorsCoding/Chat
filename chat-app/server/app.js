const express = require('express');

const app = express();
const server = require('http').Server(app);
const socketIO = require('socket.io');

const morgan = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const Message = require('./models/Message');

app.use(
	morgan(
		'[:date[clf]] ":method :url HTTP/:http-version" :status  :response-time ms'
	)
);

app.use(express.static(path.resolve(__dirname, 'build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('./models').connect(
	'mongodb://admin:admin@ds115546.mlab.com:15546/chat-logs'
);

app.get('*', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});

const io = socketIO(server);

// CONST FOR HOLDING CONNECTIONS IN SOCKET IO DATA
const SOCKETS_DATA = {
	connections: [],
	roomNumber: 1,
};

// SOCKET IO LOGIC
io.on('connection', socket => {
	// MULTIPLE CONNECTION FIX && ADD NEW CONNECTED USER TO CONST
	if (
		SOCKETS_DATA.connections.filter(
			user => user.username === socket.handshake.query.username
		).length
	) {
		SOCKETS_DATA.connections.map(user =>
			user.username === socket.handshake.query.username
				? {
					socketInstance: socket,
					color: socket.handshake.query.color,
					username: socket.handshake.query.username,
				  }
				: user
		);
	} else {
		SOCKETS_DATA.connections.push({
			socketInstance: socket,
			color: socket.handshake.query.color,
			username: socket.handshake.query.username,
		});
	}

	// join room "GLOBAL"
	socket.join('global');

	// fetch messages in "GLOBAL" and emit INITIAL DATA to THE CLIENT
	Message.find({ room: 'global' })
		.sort({ date: 1 })
		.then(messages => {
			socket.emit('initial_data', {
				messages,
				online: SOCKETS_DATA.connections.map(data => ({
					...data,
					socketInstance: undefined,
				})),
			});
			socket.broadcast.emit('user_connected', {
				online: SOCKETS_DATA.connections.map(data => ({
					...data,
					socketInstance: undefined,
				})),
			});
		});

	// REMOVE CONNECTION FROM CONST ON DISCONNECT && EMIT ACTION TO THE CLIENT FOR ONLINE UPDATE
	socket.on('disconnect', () => {
		SOCKETS_DATA.connections = SOCKETS_DATA.connections.filter(
			connection => connection.socketInstance.id !== socket.id
		);
		io.emit('user_disconnected', {
			online: SOCKETS_DATA.connections.map(data => ({
				...data,
				socketInstance: undefined,
			})),
		});
	});

	// IF USER SEND MESSAGE FROM CLIENT TO OTHER CLIENT
	socket.on('user_send_message', (data, callback) => {
		const message = new Message(data);

		// CREATE MESSAGE IN DB && SAVE && CHECK IF IT"S GLOBAL ROOM
		message.save((err, createdMessage) => {
			if (err) {
				console.log(err);
			} else if (createdMessage.participants.length > 0) {
				// AUTHOR
				const from = createdMessage.participants[0];
				// RECIPIENT
				const to = createdMessage.participants[1];

				// RECIPIENT SOCKET INSTANCE
				const recipientSocket = SOCKETS_DATA.connections.filter(
					connection => connection.username === to
				)[0].socketInstance;
				// CONNECTED USERS IN ROOM
				const onlineInRoom =
					io.sockets.adapter.rooms[data.room].sockets;
				const online = SOCKETS_DATA.connections.filter(
					user => onlineInRoom[user.socketInstance.id]
				);
				// RECIPIENT JOIN ROOM CREATED BY AUTHOR IN 'room_join'
				recipientSocket.join(data.room);

				// FETCH INITIAL ROOM DATA FOR RECIPIENT IF HE WASN'T IN ROOM BEFORE
				Message.find({ participants: { $all: [to, from] } })
					.sort({ date: 1 })
					.then(messages => {
						socket.broadcast.to(data.room).emit('recieve_message', {
							visibleName: from,
							message: createdMessage,
							messages,
							online: online.map(onlineData => ({
								...onlineData,
								socketInstance: undefined,
							})),
						});
						callback();
					});
			} else {
				socket.broadcast
					.to(createdMessage.room)
					.emit('recieve_message', {
						message: createdMessage,
						online: SOCKETS_DATA.connections.map(onlineData => ({
							...onlineData,
							socketInstance: undefined,
						})),
					});
				callback();
			}
		});
	});

	// Client joined to room with other user (when clicked on username in users list);
	socket.on('room_join', ({ to, from }, callback) => {
		const roomName = `room${SOCKETS_DATA.roomNumber}`;
		socket.join(roomName);
		SOCKETS_DATA.roomNumber += 1;
		Message.find({
			participants: { $all: [to, from] },
		})
			.sort({ date: 1 })
			.then(messages => {
				callback({
					messages,
					roomName,
				});
			});
	});
});
server.listen(process.env.PORT || 8080, () => {
	console.log('server is running on port 8080');
});
