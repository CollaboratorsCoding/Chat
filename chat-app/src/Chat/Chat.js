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
			showUserList: true,
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
			
				this.setState(prevState => ({
					rooms: {
						...prevState.rooms,
						[message.room]: {
							visibleName: prevState.rooms[message.room]
								? prevState.rooms[message.room].visibleName
								: visibleName,
							online:
								online || prevState.rooms[message.room].online,
							messages: prevState.rooms[message.room]
								? [
										...prevState.rooms[message.room]
											.messages,
										message,
								  ]
								: messages,
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

		if (message.length < 1) return;
		const messageData = {
			author: this.props.username,
			color: this.props.color || '#fff',
			message,
			room: currentRoom,
			date: Date.now(),
		};
		this.setState(prevState => ({
			charsLeft: 240,
			message: '',
			rooms: {
				...prevState.rooms,
				[currentRoom]: {
					...prevState.rooms[currentRoom],
					messages: [
						...prevState.rooms[currentRoom].messages,
						messageData,
					],
				},
			},
		}));
		this.scrollToBottom();
		this.socket.emit(
			'user_send_message',
			{
				...messageData,
				participants:
					currentRoom === 'global'
						? []
						: [this.props.username, rooms[currentRoom].visibleName],
			},
			() => {}
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
			showUserList
		} = this.state;
	
		const roomMessages = rooms[currentRoom].messages;
		const roomUsers = rooms[currentRoom].online;

		if (loading) return <div>Loading...</div>;
		let messagesList = (
			<div className="empty-state">
				<div>No messages now...</div>
				<img
					src="https://app.optimizely.com/static/img/p13n/page-list-empty-state.svg"
					alt=""
				/>
			</div>
		);
		if (roomMessages.length > 0) {
			messagesList = roomMessages.map((message, i) => {
				return (
					<div key={i} className={`chat-message__item ${this.props.username === message.author ? 'author' : ''}`}>
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
								key={room}
								onClick={() => {
									this.handleWindowRoomClick(room);
								}}
								className={`chat--windows__item ${
									room === currentRoom ? 'active-window' : ''
								}`}
							>
								<div className="chat--windows__roomname">
									{rooms[room].visibleName}
								</div>
								{room !== 'global' && (
									<span
										onClick={e => {
											e.stopPropagation();
											this.handleWindowClose(room);
										}}
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
					<aside className={`chat--users ${showUserList ? '' : 'shrink'}`}>
						<div className="hide-arrow" onClick={()=> this.setState((prevState) => ({
							showUserList: !prevState.showUserList,
						}))}>{showUserList ? <span>&rarr;</span>: <span>&larr;</span> }</div>
						<h3>Users in Room:</h3>
						<div className='chat--users__list'>
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
									{user.username}{' '}
									{user.username === this.props.username
										? '(You)'
										: ''}
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
							onKeyDown={e => {
								if ((e.keyCode || e.which) === 13) {
									e.preventDefault();
									return this.handleMessageSend();
								}
								return;
							}}
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
