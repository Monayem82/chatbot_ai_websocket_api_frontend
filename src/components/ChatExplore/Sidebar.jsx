const Sidebar = ({ users, groups, setActiveChat, activeChat }) => {
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Messages</h2>
            
            <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Private Chats</h3>
                <ul className="menu bg-base-100 w-full p-0">
                    {users.map(user => (
                        <li key={user.id}>
                            <a 
                                className={activeChat?.id === user.id && activeChat?.type === 'private' ? 'active' : ''}
                                onClick={() => setActiveChat({id: user.id, name: user.username, type: 'private'})}
                            >
                                {user.username}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-semibold uppercase text-gray-500">Groups</h3>
                    <button className="btn btn-xs btn-outline btn-primary">+ New</button>
                </div>
                <ul className="menu bg-base-100 w-full p-0">
                    {groups.map(group => (
                        <li key={group.id}>
                            <a 
                                className={activeChat?.id === group.id && activeChat?.type === 'group' ? 'active text-blue-600 font-bold' : ''}
                                onClick={() => setActiveChat({id: group.id, name: group.group_name, type: 'group'})}
                            >
                                # {group.group_name}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;