import React, { Component } from 'react';
import { CirclePicker } from 'react-color';
import Chat from './Chat/Chat';

export class App extends Component {
	state = {
		username: '',
		enter: false,
		color: '#fff',
		picker: false,
	};
	handleEnterChatClick = () => {
		if (this.state.username.length < 13 && this.state.username.length > 2) {
			localStorage.setItem('username', this.state.username);
			localStorage.setItem('color', this.state.color);
			this.setState({
				enter: true,
			});
		}
	};
	render() {
		const { enter, username, color, picker } = this.state;
		const oldUsername = localStorage.getItem('username');
		const oldColor = localStorage.getItem('color');
		if (
			enter ||
			(oldUsername && oldUsername.length > 0 && oldUsername.length < 13)
		)
			return <Chat username={oldUsername || username} color={oldColor} />;
		return (
			<div className="chat-enter">
				<input
					onChange={e =>
						this.setState({
							username: e.target.value,
						})
					}
					type="text"
				/>
				Choose UserName Color:
				<div
					onClick={() =>
						this.setState(prevState => ({
							picker: !prevState.picker,
						}))
					}
					style={{
						backgroundColor: color,
						width: '70px',
						height: '30px',
						cursor: 'pointer',
					}}
				/>
				{picker ? (
					<CirclePicker
						color={this.state.color}
						onChange={color =>
							this.setState({
								color: color.hex,
							})
						}
					/>
				) : null}
				<button onClick={this.handleEnterChatClick}>Enter</button>
			</div>
		);
	}
}

export default App;
