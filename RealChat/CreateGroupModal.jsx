import React, { useState, useEffect } from 'react';
import api from '../../context/api';

const CreateGroupModal = ({ onGroupCreated }) => {
    const [groupName, setGroupName] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    useEffect(() => {
        api.get('chatapp-ws/api/users/').then(res => setUsers(res.data));
    }, []);

    const toggleUser = (id) => {
        setSelectedUsers(prev => 
            prev.includes(id) ? prev.filter(uId => uId !== id) : [...prev, id]
        );
    };

    const handleCreate = async () => {
        if (!groupName || selectedUsers.length === 0) return alert("গ্ৰুপের নাম এবং মেম্বার সিলেক্ট করুন");
        
        try {
            const res = await api.post('chatapp-ws/api/groups/create/', {
                group_name: groupName,
                member_ids: selectedUsers
            });
            document.getElementById('group_modal').close();
            setGroupName("");
            setSelectedUsers([]);
            if (onGroupCreated) onGroupCreated(res.data);
            window.location.reload(); // ইনবক্স রিফ্রেশ করার জন্য সহজ পথ
        } catch (err) {
            console.error("Error creating group", err);
        }
    };

    return (
        <dialog id="group_modal" className="modal">
            <div className="modal-box max-w-sm">
                <h3 className="font-bold text-lg mb-4">Create New Group</h3>
                <input 
                    type="text" 
                    placeholder="Group Name" 
                    className="input input-bordered w-full mb-4" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                />
                
                <p className="text-xs font-bold opacity-50 mb-2 uppercase">Select Members</p>
                <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
                    {users.map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg">
                            <input 
                                type="checkbox" 
                                className="checkbox checkbox-primary checkbox-sm" 
                                checked={selectedUsers.includes(user.id)}
                                onChange={() => toggleUser(user.id)}
                            />
                            <span className="text-sm">{user.username}</span>
                        </div>
                    ))}
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={() => document.getElementById('group_modal').close()}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleCreate}>Create Group</button>
                </div>
            </div>
        </dialog>
    );
};

export default CreateGroupModal;