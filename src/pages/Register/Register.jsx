import React from 'react';
import { NavLink } from 'react-router';

const Register = () => {
    return (
        <div className="card bg-base-100 mx-auto p-4 m-6 w-full max-w-sm shrink-0 shadow-2xl">
            <div className="card-body">
                <h1 className='text-3xl text-center'>Sing Up </h1>
                <fieldset className="fieldset">
                    <label className="label">Email</label>
                    <input type="email" className="input" placeholder="Email" />
                    <label className="label">Password</label>
                    <input type="password" className="input" placeholder="Password" />
                    <div className='flex justify-between mt-4'>
                        <NavLink to={'/login'} className='link link-hover'>All Ready have an account</NavLink>
                        <NavLink to={'/login'} className='link link-hover'>login</NavLink>
                    </div>
                    <button className="btn btn-neutral mt-4">Register</button>
                </fieldset>
            </div>
        </div>
    );
};

export default Register;