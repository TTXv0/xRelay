import React, { 
    createContext, 
    useContext, 
    useState, 
    useRef, 
    useCallback, 
    useEffect, 
    ReactNode,
    useMemo
} from 'react';
import { Message, SenderType } from '../types';
import { fetchInitialChatter, getBotResponse } from '../services/geminiService';

export interface UserProfile {
    name: string;
    color: string;
    level: number;
}
interface CurrentUser {
    name: string;
}

// --- User Metadata Hook (centralized in context) ---
const useUserMeta = (currentUser: CurrentUser | null) => {
    const [userMeta, setUserMeta] = useState<Record<string, { color: string; level: number }>>({});
    
    const colors = useMemo(() => [
        '#c58af9', '#f04747', '#faa61a', '#43b581', '#593695', '#3498db', '#e91e63'
    ], []);

    const assignUserMeta = useCallback((sender: string) => {
        // No need to assign meta for current user or bots with hardcoded meta
        if (sender === currentUser?.name || sender === 'GeminiBot' || sender === 'ChanServ') return;

        setUserMeta(prevMeta => {
            // Check if meta already exists using the most recent state to prevent re-renders
            if (prevMeta[sender]) {
                return prevMeta;
            }

            // If not, generate and add new meta
            let hash = 0;
            for (let i = 0; i < sender.length; i++) {
                hash = sender.charCodeAt(i) + ((hash << 5) - hash);
                hash = hash & hash;
            }
            const color = colors[Math.abs(hash) % colors.length];
            const level = Math.random() > 0.4 ? Math.floor(Math.random() * 8) + 1 : 0;
            
            const newMeta = { color, level };
            return { ...prevMeta, [sender]: newMeta };
        });
    }, [colors, currentUser]);

    const getUserMeta = useCallback((sender: string) => {
        if (sender === currentUser?.name) return { color: '#7289da', level: 0 };
        if (sender === 'GeminiBot') return { color: '#43b581', level: 0 };
        return userMeta[sender] || { color: '#969d9f', level: 0 };
    }, [userMeta, currentUser]);

    return { getUserMeta, assignUserMeta, setUserMeta };
};


interface ChatContextType {
    messages: Message[];
    channel: string;
    isLoading: boolean;
    isAuthenticated: boolean;
    isProfileModalOpen: boolean;
    selectedUser: UserProfile | null;
    handleSendMessage: (text: string) => Promise<void>;
    getUserMeta: (sender: string) => { color: string; level: number };
    login: () => void;
    logout: () => void;
    openProfileModal: (user: UserProfile) => void;
    closeProfileModal: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [channel] = useState('google.com'); // Simulated domain
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    const chatterQueue = useRef<{ sender: string; text: string }[]>([]);
    const { getUserMeta, assignUserMeta, setUserMeta } = useUserMeta(currentUser);

    const resetState = useCallback(() => {
        setMessages([]);
        setIsLoading(true);
        chatterQueue.current = [];
        setUserMeta({});
    }, [setUserMeta]);

    const login = () => {
        setCurrentUser({ name: '@You' });
        setIsAuthenticated(true);
    };

    const logout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        resetState();
    };
    
    const openProfileModal = (user: UserProfile) => {
        setSelectedUser(user);
        setIsProfileModalOpen(true);
    };

    const closeProfileModal = () => {
        setIsProfileModalOpen(false);
        setSelectedUser(null);
    };

    const addMessage = useCallback((text: string, sender: string, senderType: SenderType) => {
        if (senderType === SenderType.IRC_USER) {
            assignUserMeta(sender);
        }
        
        const newMessage: Message = {
            id: crypto.randomUUID(),
            text,
            sender,
            senderType,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newMessage]);
    }, [assignUserMeta]);

    useEffect(() => {
        if (!isAuthenticated) return;
        
        const initializeChat = async () => {
            resetState();
            const { welcomeMessage, chatter } = await fetchInitialChatter(`#${channel}`);
            addMessage(welcomeMessage.text, welcomeMessage.sender, SenderType.SYSTEM);
            chatterQueue.current = chatter;
            setIsLoading(false);
        };
        initializeChat();
    }, [isAuthenticated, channel, addMessage, resetState]);

    useEffect(() => {
        if (isLoading || !isAuthenticated) return;

        const chatterInterval = setInterval(() => {
            if (chatterQueue.current.length > 0) {
                const nextChatter = chatterQueue.current.shift();
                if (nextChatter) {
                    addMessage(nextChatter.text, nextChatter.sender, SenderType.IRC_USER);
                }
            } else {
                clearInterval(chatterInterval);
            }
        }, 6000);

        return () => clearInterval(chatterInterval);
    }, [isLoading, isAuthenticated, addMessage]);

    const handleSendMessage = async (text: string) => {
        if (!currentUser) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            text,
            sender: currentUser.name,
            senderType: SenderType.USER,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        
        const messagesForContext = [...messages, userMessage];
        const botResponse = await getBotResponse(text, `#${channel}`, messagesForContext);
        
        addMessage(botResponse, 'GeminiBot', SenderType.BOT);
        setIsLoading(false);
    };

    const value = {
        messages,
        channel,
        isLoading,
        isAuthenticated,
        isProfileModalOpen,
        selectedUser,
        handleSendMessage,
        getUserMeta,
        login,
        logout,
        openProfileModal,
        closeProfileModal,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};