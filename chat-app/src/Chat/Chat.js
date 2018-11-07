import React, { Component } from 'react';
import io from 'socket.io-client';

class Chat extends Component {
	constructor(props) {
		super(props);

		this.state = {
			username: 'Annonymous',
			messages: [],
			message: '',
			charsLeft: 240,
			online: {},
			loading: true,
		};

		this.socket = io(
			document.location.protocol + '//' + document.location.host,
			{ query: `username=${this.state.username}` }
		);
	}

	componentWillMount = () => {
		this.socket.on('initial_data', data => {
			this.setState({
				...data,
				loading: false,
			});
		});

		this.socket.on('recieve_global_message', message => {
			this.setState(prevState => ({
				messages: [...prevState.messages, message],
			}));
		});
		this.socket.on('user_disconnected', ({ online }) => {
			this.setState({
				online,
			});
		});
		this.socket.on('user_connected', ({ online }) => {
			this.setState({
				online,
			});
		});
	};

	scrollToBottom() {
		this.el.scrollIntoView({ behaviour: 'smooth' });
	}

	handleMessageOnChange = e => {
		this.setState({
			message: e.target.value,
			symbols: 240 - e.target.value.length,
		});
	};

	handleMessageSend = () => {
		const { username: author, message, online } = this.state;
		this.socket.emit(
			'user_send_global_message',
			{
				author,
				color:
					online.filter(user => user.id === this.socket.id)[0]
						.color || '#fff',
				message,
			},
			() => {
				this.setState({
					charsLeft: 240,
					message: '',
				});
			}
		);
	};

	componentWillUnmount = () => {
		this.socket.disconnect();
	};

	render() {
		const { messages, message, loading, charsLeft, online } = this.state;
		if (loading) return <div>Loading...</div>;
		let messagesList = <div>No messages for now</div>;
		if (messages.length > 0) {
			messagesList = messages.map((message, i) => {
				return (
					<div key={i} className="element">
						<span
							style={{
								color: '#b5b5b5',
								marginRight: '25px',
							}}
						>
							{message.date}
						</span>
						<span
							style={{
								color: message.color,
								fontWeight: 'bold',
							}}
						>
							{message.author}
						</span>
						: {message.message}
					</div>
				);
			});
		}

		return (
			<div className="chat--wrapper">
				<div className="chat--header">Чат</div>
				<div className="chat--main-box">
					<div className="chat--messages-box">{messagesList}</div>
					<div
						ref={el => {
							this.el = el;
						}}
					/>
				</div>
				<div className="chat--controls-box">
					<textarea
						maxLength="240"
						rows={4}
						value={message}
						onChange={this.handleMessageOnChange}
					/>
					<p>{charsLeft}</p>
					<button
						type="primary"
						onClick={this.handleMessageSend}
						className="btn btn-primary form-control"
					>
						Send
					</button>
				</div>
				<aside>Users Online: {online.map(user => user.username)}</aside>
			</div>
		);
	}
}

export default Chat;
