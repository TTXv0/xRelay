import React, { useState, useEffect, useRef } from 'react';
import { Message, SenderType } from './types';
import { ChatProvider, useChat, UserProfile } from './state/ChatContext';
import LoginScreen from './LoginScreen';
import UserProfileModal from './UserProfileModal';

// --- Icon Components ---
const BookmarkIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
    </svg>
);
const FlameIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M12.293 2.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L13 4.414V17a1 1 0 11-2 0V4.414L7.707 7.707a1 1 0 01-1.414-1.414l4-4z" clipRule="evenodd" />
    </svg>
);
const LogoutIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

// --- UI Components ---
interface HeaderProps {
    channel: string;
    onLogout: () => void;
}
const Header: React.FC<HeaderProps> = ({ channel, onLogout }) => (
    <header className="bg-[#2f3136] p-3 flex-shrink-0 shadow-md z-10">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-white font-bold text-md">{channel}</h1>
                <p className="text-xs text-gray-400">438 online across Relay</p>
            </div>
            <div className="flex items-center space-x-3 text-gray-400">
                <button aria-label="Bookmark" className="hover:text-white transition-colors"><BookmarkIcon /></button>
                <button aria-label="Trending" className="hover:text-white transition-colors"><FlameIcon /></button>
                <button onClick={onLogout} aria-label="Logout" className="hover:text-white transition-colors"><LogoutIcon /></button>
            </div>
        </div>
    </header>
);

interface MessageRowProps {
    message: Message;
    userColor: string;
    userLevel: number;
}
const MessageRow: React.FC<MessageRowProps> = ({ message, userColor, userLevel }) => {
    const { sender, text, timestamp, senderType } = message;
    const { openProfileModal } = useChat();

    const handleUserClick = () => {
        if (senderType === SenderType.IRC_USER || senderType === SenderType.USER || senderType === SenderType.BOT) {
            openProfileModal({ name: sender, color: userColor, level: userLevel });
        }
    };

    if (senderType === SenderType.SYSTEM) {
        return (
            <div className="px-4 py-2 text-sm text-center">
                <p className="text-gray-400 italic">--- {text} ---</p>
            </div>
        );
    }
    
    const formattedTimestamp = new Date(timestamp).toLocaleTimeString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).replace(',', '');
    
    const textParts = text.split(/(@\w+)/g).map((part, i) => {
        if (part.startsWith('@')) {
            return <span key={i} className="bg-blue-800/50 text-blue-300 rounded px-1 py-0.5">{part}</span>
        }
        return part;
    });

    return (
        <div className="px-4 py-0.5 hover:bg-black/20 transition-colors duration-150">
            <div className="flex items-baseline">
                <div className="flex-grow">
                    <button onClick={handleUserClick} className="font-semibold text-sm pr-1.5 cursor-pointer text-left" style={{ color: userColor }}>
                        {sender}
                    </button>
                    {userLevel > 0 && (
                        <span className="text-yellow-500 mr-1.5 text-xs font-bold align-middle" title={`Level ${userLevel}`}>
                        ★{userLevel > 1 && <span className="text-gray-500 text-xs font-normal">x{userLevel}</span>}
                        </span>
                    )}
                    <span className="text-gray-200 text-sm whitespace-pre-wrap break-words">{textParts}</span>
                </div>
                <time className="text-gray-500 text-[10px] ml-4 flex-shrink-0">{formattedTimestamp}</time>
            </div>
        </div>
    );
};


interface ChatWindowProps {
    messages: Message[];
    isLoading: boolean;
    getUserMeta: (sender: string) => { color: string, level: number };
}
const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, getUserMeta }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]);

    return (
        <main className="flex-1 pt-2 pb-2 overflow-y-auto bg-[#36393f]">
            {messages.map((msg) => {
                 const meta = getUserMeta(msg.sender);
                 return <MessageRow key={msg.id} message={msg} userColor={meta.color} userLevel={meta.level} />
            })}
            {isLoading && (
                 <div className="px-4 py-1 text-gray-400 text-sm">
                    <p>GeminiBot is typing...</p>
                 </div>
            )}
            <div ref={scrollRef} />
        </main>
    );
};

interface MessageInputProps {
    onSendMessage: (message: string) => void;
    disabled: boolean;
    channel: string;
}
const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled, channel }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim() && !disabled) {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };
    
    return (
        <footer className="bg-[#36393f] p-3 border-t border-black/20">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message #${channel}`}
                className="w-full bg-[#40444b] text-gray-200 rounded-md py-2 px-3 focus:outline-none placeholder-gray-500 transition-colors"
                disabled={disabled}
                aria-label={`Message #${channel}`}
            />
        </footer>
    );
};

// --- App Structure ---
const ChatUI: React.FC = () => {
    const { 
        channel, 
        messages, 
        isLoading, 
        getUserMeta, 
        handleSendMessage, 
        logout,
        isProfileModalOpen,
        selectedUser,
        closeProfileModal
    } = useChat();

    return (
        <div className="w-[380px] h-[550px] bg-[#36393f] text-white rounded-md shadow-2xl flex flex-col overflow-hidden font-sans relative">
            <Header channel={channel} onLogout={logout} />
            <ChatWindow messages={messages} isLoading={isLoading} getUserMeta={getUserMeta} />
            <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} channel={channel}/>
            {isProfileModalOpen && selectedUser && (
                <UserProfileModal user={selectedUser} onClose={closeProfileModal} />
            )}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <ChatProvider>
            <AppContent />
        </ChatProvider>
    );
};

const AppContent: React.FC = () => {
    const { isAuthenticated, login } = useChat();
    return isAuthenticated ? <ChatUI /> : <LoginScreen onLogin={login} />;
}

export default App;
