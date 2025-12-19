import React from 'react';

const CreateGroupModal = () => {
    return (
        <dialog id="group_modal" className="modal">
            <div className="modal-box">
                <h3 className="font-bold text-lg">Create New Group</h3>
                <input className="input input-bordered w-full my-4" placeholder="Group Name" />
                {/* এখানে ইউজার লিস্ট সিলেক্ট করার লজিক দিতে পারেন */}
                <div className="modal-action">
                    <button className="btn" onClick={() => document.getElementById('group_modal').close()}>Close</button>
                    <button className="btn btn-primary">Create</button>
                </div>
            </div>
        </dialog>
    );
};

export default CreateGroupModal;