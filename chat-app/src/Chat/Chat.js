import React, { Component } from 'react';
import io from 'socket.io-client';

class Chat extends Component {
	constructor(props) {
		super(props);

		this.state = {
			message: '',
			charsLeft: 240,
			currentRoom: 'global',
			loading: true,
			buttonDisabled: false,
			rooms: {
				global: {
					visibleName: 'global',
					messages: [],
					online: {},
				},
			},
		};

		this.socket = io(
			document.location.protocol + '//' + document.location.host,
			{
				query: `username=${this.props.username}&color=${
					this.props.color
				}`,
			}
		);
	}

	componentWillMount = () => {
		this.socket.on('initial_data', ({ messages, online }) => {
			this.setState(prevState => ({
				rooms: {
					...prevState.rooms,
					global: {
						visibleName: 'global',
						messages,
						online,
					},
				},
				loading: false,
			}));
			this.scrollToBottom();
		});

		this.socket.on(
			'recieve_message',
			({ message, messages, online, visibleName }) => {
				console.log(message, online);
				this.setState(prevState => ({
					rooms: {
						...prevState.rooms,
						[message.room]: {
							visibleName: prevState.rooms[message.room]
								? prevState.rooms[message.room].visibleName
								: visibleName,
							online:
								online || prevState.rooms[message.room].online,
							messages: [
								...(prevState.rooms[message.room]
									? prevState.rooms[message.room].messages
									: messages),
								message,
							],
						},
					},
				}));
			}
		);
		this.socket.on('user_disconnected', ({ online }) => {
			this.setState(prevState => ({
				rooms: {
					...prevState.rooms,
					global: {
						...prevState.rooms.global,
						online,
					},
				},
			}));
		});
		this.socket.on('user_connected', ({ online }) => {
			this.setState(prevState => ({
				rooms: {
					...prevState.rooms,
					global: {
						...prevState.rooms.global,
						online,
					},
				},
			}));
		});
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
		const { message, currentRoom, rooms } = this.state;

		if (message.length < 5) return;
		this.socket.emit(
			'user_send_message',
			{
				author: this.props.username,
				color: this.props.color || '#fff',
				message,
				room: currentRoom,
				participants:
					currentRoom === 'global'
						? []
						: [this.props.username, rooms[currentRoom].visibleName],
			},
			() => {
				this.setState({
					charsLeft: 240,
					message: '',
				});
			}
		);
	};
	handleNewRoom = recipient => {
		this.setState({
			buttonDisabled: true,
		});
		const roomExist = Object.keys(this.state.rooms).filter(
			room => this.state.rooms[room].visibleName === recipient
		).length;
		if (this.props.username === recipient || roomExist) return;
		this.socket.emit(
			'room_join',
			{
				to: recipient,
				from: this.props.username,
			},
			({ messages, roomName }) => {
				this.setState(prevState => ({
					buttonDisabled: false,
					currentRoom: roomName,
					rooms: {
						...prevState.rooms,
						[roomName]: {
							visibleName: recipient,
							messages: messages,
							online: [
								{
									username: this.props.username,
									color: this.props.color,
								},
							],
						},
					},
				}));
			}
		);
	};

	handleWindowRoomClick = name => {
		this.setState({
			currentRoom: name,
		});
	};
	handleWindowClose = name => {
		const { rooms } = this.state;
		const roomsCopy = { ...rooms };
		delete roomsCopy[name];
		const roomsName = Object.keys(roomsCopy);
		const prevRoom = roomsName[roomsName.length - 1];

		this.setState({
			rooms: roomsCopy,
			currentRoom: prevRoom,
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
			buttonDisabled,
		} = this.state;
		console.log(rooms, currentRoom);
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
						{Object.keys(rooms).map(room => (
							<div
								className={`chat--windows__item ${
									room === currentRoom ? 'active-window' : ''
								}`}
							>
								<div
									onClick={() => {
										this.handleWindowRoomClick(room);
									}}
									className="chat--windows__roomname"
								>
									{rooms[room].visibleName}
								</div>
								{room !== 'global' && (
									<span
										onClick={() =>
											this.handleWindowClose(room)
										}
										className="chat--windows__close"
									>
										&times;
									</span>
								)}
							</div>
						))}
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
									onClick={() => {
										if (!buttonDisabled) {
											this.handleNewRoom(user.username);
										}
									}}
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