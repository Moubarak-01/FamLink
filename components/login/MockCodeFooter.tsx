import React from 'react';

export default function MockCodeFooter() {
    return (
        <div className="hidden lg:block w-full max-w-2xl mx-auto mt-8 opacity-70 hover:opacity-100 transition-opacity duration-300">
            <div className="rounded-t-lg bg-[#1e1e1e] flex items-center px-4 py-2 space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-gray-400 font-mono">FamLink v1.8 - Login.tsx</span>
            </div>
            <div className="bg-[#1e1e1e]/90 backdrop-blur-md p-4 rounded-b-lg border-t border-white/10 font-mono text-xs overflow-hidden">
                <div className="text-gray-300">
                    <span className="text-pink-400">export default</span> <span className="text-blue-400">function</span> <span className="text-yellow-300">Login</span>() {'{'}
                    <br />
                    &nbsp;&nbsp;<span className="text-purple-400">const</span> {'{'} login {'}'} = <span className="text-blue-300">useAuth</span>();
                    <br />
                    &nbsp;&nbsp;<span className="text-purple-400">return</span> (
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-yellow-300">AuthLayout</span> title="Welcome Back"&gt;
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-yellow-300">LoginForm</span> <span className="text-blue-300">onSubmit</span>={'{handleLogin}'} /&gt;
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-yellow-300">AuthLayout</span>&gt;
                    <br />
                    &nbsp;&nbsp;);
                    <br />
                    {'}'}
                </div>
            </div>
        </div>
    );
}
