import React, { Component } from 'react';
import io from 'socket.io-client';

class Chat extends Component {
	constructor(props) {
		super(props);

		this.state = {
			username: props.username,
			message: '',
			charsLeft: 240,
			activeRoom: 'global',
			loading: true,
			rooms: {
				global: {
					messages: [],
					online: {},
				},
			}
		};

		this.socket = io(
			document.location.protocol + '//' + document.location.host,
			{
				query: `username=${this.state.username}&color=${
					this.props.color
				}`,
			}
		);
	}

	componentWillMount = () => {
		this.socket.on('initial_data', ({messages,online}) => {
			this.setState((prevState) => ({
					rooms: {
						...prevState.rooms,
						global: {
							messages,
							online
						}
					},
					loading: false,
				
			}));
			this.scrollToBottom();
		});

		this.socket.on('recieve_message', message => {
			this.setState(prevState => ({
				rooms: {
					...prevState.rooms,
					[message.room]: {
						...[prevState.rooms[message.room]],
						message: [...prevState.rooms[message.room].messages, message]
					}
				}
			}));
		});
		// this.socket.on('user_disconnected', ({ online }) => {
		// 	this.setState({
		// 		online,
		// 	});
		// });
		// this.socket.on('user_connected', ({ online }) => {
		// 	this.setState({
		// 		online,
		// 	});
		// });
	};

	scrollToBottom() {
		this.el.scrollIntoView({ behaviour: 'smooth' });
	}

	handleMessageOnChange = e => {
		this.setState({
			message: e.target.value,
			charsLeft: 240 - e.target.value.length,
		});
	};

	handleMessageSend = () => {
		const { username: author, message, rooms, currentRoom } = this.state;

		if (message.length < 5) return;
		this.socket.emit(
			'user_send_message',
			{
				author,
				color:
				rooms[currentRoom].online.filter(user => user.id === this.socket.id)[0]
						.color || '#fff',
				message,
				room: currentRoom,
			},
			() => {
				this.setState({
					charsLeft: 240,
					message: '',
				});
			}
		);
	};
	handleNewRoom = user => {
		const { rooms } = this.state;
		const roomExist = rooms.filter(room => room.name === user).length;
		if (!roomExist)
			this.setState(prevState => ({
				rooms: [...prevState.rooms, { name: user }],
			}));
	};
	handleWindowClose = name => {
		const { rooms } = this.state;
		this.setState({
			rooms: rooms.filter(room => room.name !== name),
		});
	};

	componentWillUnmount = () => {
		this.socket.disconnect();
	};

	render() {
		const {
			message,
			loading,
			charsLeft,
			rooms,
			currentRoom,
		} = this.state;
		const roomMessages = rooms[currentRoom].messages;
		const roomUsers = rooms[currentRoom].online;
		if (loading) return <div>Loading...</div>;
		let messagesList = <div>No messages for now</div>;
		if (roomMessages.length > 0) {
			messagesList = roomMessages.map((message, i) => {
				return (
					<div key={i} className="chat-message__item">
						<span className="chat-message__date">
							{new Date(message.date).toLocaleString()}
						</span>
						<span
							className="chat-message__author"
							style={{
								color: message.color,
							}}
						>
							{message.author}:
						</span>

						<span className="chat-message__text">
							{message.message}
						</span>
					</div>
				);
			});
		}

		return (
			<div className="chat--wrapper">
				<div className="chat--header">
					<h3>Чат</h3>
					<div className="chat--windows-wrapper">
						{/* {rooms.map(room => (
							<div className="chat--windows__item">
								<div className="chat--windows__roomname">
									{room.name}
								</div>
								<span
									onClick={() =>
										this.handleWindowClose(room.name)
									}
									className="chat--windows__close"
								>
									&times;
								</span>
							</div>
						))} */}
					</div>
				</div>
				<div className="chat--main-box">
					<div className="chat--messages-box">
						{messagesList}
						<div
							ref={el => {
								this.el = el;
							}}
						/>
					</div>
					<aside className="chat--users">
						<h3>Users in Room:</h3>
						<div className="chat--users__list">
							{roomUsers.map((user, i) => (
								<span
									key={i}
									className="chat--users__list-item"
									style={{ color: user.color }}
									onClick={() =>
										this.handleNewRoom(user.username)
									}
								>
									{user.username}
								</span>
							))}
						</div>
					</aside>
				</div>
				<div className="chat--controls-box">
					<div className="chat--controls-input">
						<textarea
							maxLength="240"
							value={message}
							onChange={this.handleMessageOnChange}
						/>
						<span className="chat--controls-counter">
							{charsLeft}
						</span>
					</div>

					<button
						type="primary"
						onClick={this.handleMessageSend}
						className="chat--controls-sendBtn"
					>
						Send
					</button>
				</div>
			</div>
		);
	}
}

export default Chat;
