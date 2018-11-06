import React, { Component } from 'react';
import io from 'socket.io-client';

class Chat extends Component {
	constructor(props) {
		super(props);

		this.state = {
			username: '',
			messages: [],
			message: '',
			symbols: 240,
			socketId: '',
			connections: [],
			image: '',
			users: [],
		};

		this.socket = io(
			document.location.protocol + '//' + document.location.host
		);

		this.socket.on('RECEIVE_MESSAGE', function(data) {
			addMessage(data);
		});
		this.socket.on('INIT', data => {
			data.id === this.socket.id
				? initData(data)
				: updOnline(data.connections);
		});
		this.socket.on('DISC', function(data) {
			updOnline(data.connections);
		});

		const addMessage = data => {
			this.setState({
				messages: [...this.state.messages, data],
			});
			this.scrollToBottom();
		};
		const updOnline = data => {
			this.setState({ connections: data });
		};

		const initData = data => {
			this.setState(() => {
				return {
					connections: data.connections,
					messages: data.messages,
					socketId: this.socket.id,
				};
			});
			this.scrollToBottom();
		};
	}
	scrollToBottom() {
		this.el.scrollIntoView({ behaviour: 'smooth' });
	}
	sendMessage = ev => {
		ev.preventDefault();

		if (
			this.state.username.trim() &&
			this.state.message.trim() &&
			this.state.message.trim().length < 240
		) {
			const d = new Date();
			const minutes =
				d.getMinutes() >= 10 ? d.getMinutes() : '0' + d.getMinutes();
			const seconds =
				d.getSeconds() >= 10 ? d.getSeconds() : '0' + d.getSeconds();
			const time =
				d.getUTCDate() +
				'/' +
				(d.getUTCMonth() + 1) +
				' ' +
				d.getHours() +
				':' +
				minutes +
				':' +
				seconds;

			let dataState = [...this.state.connections];

			const oneIdUser = dataState.filter(item => {
				return item.id === this.socket.id;
			});

			if (oneIdUser) {
				this.socket.emit('SEND_MESSAGE', {
					author: this.state.username,
					message: this.state.message,
					date: time,
					id: this.socket.id,
					color: oneIdUser[0].color,
					image: this.state.image ? this.state.image : null,
				});
			}
			if (!oneIdUser) {
				return;
			}

			this.setState({ message: '', symbols: 240 });
		}
	};

	changeAreaHandler = event => {
		this.setState({
			message: event.target.value,
			symbols: 240 - event.target.value.length,
		});
	};
	componentDidMount = () => {
		this.setState({ username: this.props.email });
	};
	componentWillUnmount = () => {
		this.socket.disconnect();
	};

	render() {
		let messagesList = <div>Loading</div>;
		if (this.state.messages.length > 0) {
			messagesList = this.state.messages.map((message, i) => {
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
						<p>
							{message.image ? (
								<img
									className="chatImg"
									alt="Плохой адрес картинки"
									src={message.image}
								/>
							) : null}
						</p>
					</div>
				);
			});
		}

		return (
			<div>
				<div className="chatH">
					Чат
					<span
						style={{
							float: 'right',
						}}
					>
						<div
							style={{
								backgroundColor: '#87d068',
							}}
						>
							{this.state.connections.length}
						</div>
					</span>
				</div>
				<div
					className="ChatMain"
					style={{
						height: '370px',
						overflowY: 'scroll',
					}}
				>
					<div className="messages">{messagesList}</div>
					<div
						ref={el => {
							this.el = el;
						}}
					/>
				</div>
			</div>
		);
	}
}

export default Chat;
