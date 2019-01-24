import React from 'react';

function ChatControls({
	message,
	handleMessageOnChange,
	handleMessageSend,
	charsLeft,
}) {
	return (
		<div className="chat--controls-box">
			<div className="chat--controls-input">
				<textarea
					maxLength="240"
					value={message}
					onChange={handleMessageOnChange}
					onKeyDown={e => {
						if ((e.keyCode || e.which) === 13) {
							e.preventDefault();
							return handleMessageSend();
						}
						return null;
					}}
				/>
				<span className="chat--controls-counter">{charsLeft}</span>
			</div>

			<button
				type="button"
				onClick={handleMessageSend}
				className="chat--controls-sendBtn"
			>
				Send
			</button>
		</div>
	);
}

export default ChatControls;
