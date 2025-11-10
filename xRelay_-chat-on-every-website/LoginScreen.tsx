import React from 'react';

const XIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="black" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

interface LoginScreenProps {
    onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    return (
        <div className="w-[380px] h-[550px] bg-[#36393f] text-white rounded-md shadow-2xl flex flex-col items-center justify-center font-sans">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Domain IRC Relay</h1>
                <p className="text-gray-400 mb-8">Chat about any website, with anyone.</p>
                <button
                    onClick={onLogin}
                    className="bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold py-2 px-6 rounded-full flex items-center justify-center transition-colors duration-200"
                    aria-label="Login with X.com"
                >
                    <XIcon />
                    <span className="ml-3">Login with X.com</span>
                </button>
            </div>
        </div>
    );
};

export default LoginScreen;