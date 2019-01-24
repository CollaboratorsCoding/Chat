import React from 'react';

function ChatHeader({
	rooms,
	currentRoom,
	handleWindowClose,
	handleWindowRoomClick,
}) {
	return (
		<div className="chat--header">
			<h3>Чат</h3>
			<div className="chat--windows-wrapper">
				{Object.keys(rooms).map(room => (
					<div
						key={room}
						onClick={() => {
							handleWindowRoomClick(room);
						}}
						className={`chat--windows__item ${
							room === currentRoom ? 'active-window' : ''
						}`}
					>
						<div className="chat--windows__roomname">
							<span>{rooms[room].visibleName} </span>

							{rooms[room].hasNewMessages ? (
								<span className="new-message" />
							) : null}
						</div>
						{room !== 'global' && (
							<span
								onClick={e => {
									e.stopPropagation();
									handleWindowClose(room);
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
	);
}

export default ChatHeader;
