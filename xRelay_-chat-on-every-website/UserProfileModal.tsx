import React, { useMemo } from 'react';

interface UserProfile {
    name: string;
    color: string;
    level: number;
}

interface UserProfileModalProps {
    user: UserProfile;
    onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
    const mockData = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < user.name.length; i++) {
            hash = user.name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const joinDate = new Date(new Date().getTime() - Math.abs(hash * 1000) % (1000 * 60 * 60 * 24 * 365 * 3));
        const bios = [
            "Just here for the memes.",
            "Lurking more than talking.",
            "Old school netizen.",
            "Probably AFK.",
            "Lover of all things tech.",
            "Building the future, one line of code at a time."
        ];
        const bio = bios[Math.abs(hash) % bios.length];
        return {
            joinDate: joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            bio
        };
    }, [user.name]);

    return (
        <div 
            className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-profile-heading"
        >
            <div 
                className="bg-[#2f3136] rounded-lg shadow-xl w-80 p-5 border border-black/20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center mb-4">
                     <div className="w-16 h-16 rounded-full flex-shrink-0 mr-4" style={{ backgroundColor: user.color }}></div>
                     <div>
                        <h2 id="user-profile-heading" className="text-xl font-bold" style={{ color: user.color }}>{user.name}</h2>
                         {user.level > 0 && (
                            <span className="text-yellow-500 text-sm font-bold" title={`Level ${user.level}`}>
                                ★ Level {user.level}
                            </span>
                        )}
                     </div>
                </div>

                <div className="space-y-3 text-sm">
                    <div>
                        <h3 className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Bio</h3>
                        <p className="text-gray-200">{mockData.bio}</p>
                    </div>
                     <div>
                        <h3 className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Member Since</h3>
                        <p className="text-gray-200">{mockData.joinDate}</p>
                    </div>
                </div>

                 <button 
                    onClick={onClose}
                    className="mt-5 w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-md transition-colors"
                    aria-label="Close profile modal"
                 >
                    Close
                </button>
            </div>
        </div>
    );
};

export default UserProfileModal;
