import React from 'react';

class UsersListSidebar extends React.Component {
	state = {
		showUserList: false,
	};

	render() {
		const { showUserList } = this.state;
		const {
			roomUsers,
			username,
			buttonDisabled,
			handleNewRoom,
		} = this.props;
		return (
			<aside className={`chat--users ${showUserList ? '' : 'shrink'}`}>
				<div
					className="hide-arrow"
					onClick={() =>
						this.setState(prevState => ({
							showUserList: !prevState.showUserList,
						}))
					}
				>
					{showUserList ? <span>&rarr;</span> : <span>&larr;</span>}
				</div>
				<h3>Users in Room:</h3>
				<div className="chat--users__list">
					{roomUsers.map(user => (
						<span
							key={user.username}
							className="chat--users__list-item"
							style={{ color: user.color }}
							onClick={() => {
								if (!buttonDisabled) {
									handleNewRoom(user.username);
								}
							}}
						>
							{user.username}{' '}
							{user.username === username ? '(You)' : ''}
						</span>
					))}
				</div>
			</aside>
		);
	}
}

export default UsersListSidebar;
