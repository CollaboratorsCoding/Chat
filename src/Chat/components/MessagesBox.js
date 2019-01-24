import React from 'react';

function MessagesBox({ roomMessages, username }) {
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
		messagesList = roomMessages.map(message => (
			<div
				key={message._id}
				className={`chat-message__item ${
					username === message.author ? 'author' : ''
				}`}
			>
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

				<span className="chat-message__text">{message.message}</span>
			</div>
		));
	}

	return messagesList;
}

export default MessagesBox;
