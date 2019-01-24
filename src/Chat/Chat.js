import React, { Component } from 'react';
import io from 'socket.io-client';

import UsersListSidebar from './components/UsersListSidebar';
import ChatHeader from './components/ChatHeader';
import MessagesBox from './components/MessagesBox';
import ChatControls from './components/ChatControls';

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

		// SOCKET CONNECTION
		this.socket = io(
			`${document.location.protocol}//${document.location.host}`,
			{
				query: `username=${this.props.username}&color=${
					this.props.color
				}`,
			}
		);
	}

	// SCROLL DOWN IN MESSAGE BOX WHEN WINDOW CHAT CHANGED
	componentDidUpdate = (prevProps, prevState) => {
		if (prevState.currentRoom !== this.state.currentRoom) {
			this.scrollToBottom();
		}
	};

	componentWillMount = () => {
		// INITIAL DATA - MESSAGES, ONLINE
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

		// HANDLE FOR MESSAGE RECIEVED BY USER FROM ANOTHER USER
		this.socket.on(
			'recieve_message',
			({ message, messages, online, visibleName }) => {
				this.setState(prevState => {
					let roomName = message.room;
					Object.keys(prevState.rooms).forEach(room => {
						if (prevState.rooms[room].visibleName === visibleName) {
							roomName = room;
						}
					});
					return {
						rooms: {
							...prevState.rooms,
							[roomName]: {
								visibleName: prevState.rooms[roomName]
									? prevState.rooms[roomName].visibleName
									: visibleName,
								online:
									online || prevState.rooms[roomName].online,
								messages: prevState.rooms[roomName]
									? [
										...prevState.rooms[roomName]
											.messages,
										message,
									  ]
									: messages,
								hasNewMessages:
									prevState.currentRoom !== roomName,
							},
						},
					};
				});
			}
		);

		// UPDATE ONLINE ON DISC
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

		// UPDATE ONLINE ON CONNECT
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

	componentWillUnmount = () => {
		this.socket.disconnect();
	};

	handleMessageOnChange = e => {
		this.setState({
			message: e.target.value,
			charsLeft: 240 - e.target.value.length,
		});
	};

	handleMessageSend = async () => {
		const { message, currentRoom, rooms } = this.state;

		if (message.length < 1) return;

		// CHANGE STATE WITH NEW MESSAGE IN ROOM
		const messageData = {
			author: this.props.username,
			color: this.props.color || '#fff',
			message,
			room: currentRoom,
			date: Date.now(),
		};
		await this.setState(prevState => ({
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

		// EMIT SOCKET FOR SAVE MESSAGE IN DB AND SEND IT VIA SOCKET TO RECIPIENT
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
		// CHECK IF ROOM ALREADY OPENED
		const roomExist = Object.keys(this.state.rooms).filter(
			room => this.state.rooms[room].visibleName === recipient
		).length;
		if (this.props.username === recipient || roomExist) return;

		// IF NO - EMIT SOCKET TO JOIN ROOM && FETCH ALL MESSAGES WITH THAT PARTICIPANTS IN ROOM AS CALLBACK
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
							messages,
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
		const { rooms } = this.state;
		this.setState({
			currentRoom: name,
			rooms: {
				...rooms,
				[name]: {
					...rooms[name],
					hasNewMessages: false,
				},
			},
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

	scrollToBottom() {
		this.el.scrollIntoView({ behaviour: 'smooth' });
	}

	render() {
		const {
			message,
			loading,
			charsLeft,
			rooms,
			currentRoom,
			buttonDisabled,
		} = this.state;

		const roomMessages = rooms[currentRoom].messages;
		const roomUsers = rooms[currentRoom].online;

		if (loading) return <div>Loading...</div>;
		return (
			<div className="chat--wrapper">
				<ChatHeader
					rooms={rooms}
					currentRoom={currentRoom}
					handleWindowClose={this.handleWindowClose}
					handleWindowRoomClick={this.handleWindowRoomClick}
				/>
				<div className="chat--main-box">
					<div className="chat--messages-box">
						<MessagesBox
							roomMessages={roomMessages}
							username={this.props.username}
						/>
						<div
							ref={el => {
								this.el = el;
							}}
						/>
					</div>
					<UsersListSidebar
						roomUsers={roomUsers}
						username={this.props.username}
						buttonDisabled={buttonDisabled}
						handleNewRoom={this.handleNewRoom}
					/>
				</div>
				<ChatControls
					message={message}
					handleMessageOnChange={this.handleMessageOnChange}
					handleMessageSend={this.handleMessageSend}
					charsLeft={charsLeft}
				/>
			</div>
		);
	}
}

export default Chat;
