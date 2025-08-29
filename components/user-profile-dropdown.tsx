'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuth } from '@/components/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  LogOut, 
  Settings, 
  ChevronDown,
  Shield,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function UserProfileDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const auth = getFirebaseAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatJoinDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Trigger Button */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 h-auto hover:bg-gray-100 rounded-xl transition-colors"
      >
        <Avatar className="h-10 w-10 ring-2 ring-indigo-100">
          <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-semibold">
            {user.displayName ? getInitials(user.displayName) : user.email?.[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">
            {user.displayName || 'User'}
          </span>
          <span className="text-xs text-gray-500 truncate max-w-32">
            {user.email}
          </span>
        </div>
        
        <ChevronDown 
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </Button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-80 z-50"
          >
            <Card className="border border-white/20 shadow-xl shadow-black/20 bg-white/10 backdrop-blur-xl" style={{
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)'
            }}>
              <CardContent className="p-0">
                {/* User Info Header */}
                <div className="p-6 bg-white/10 backdrop-blur-sm border-b border-white/20">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16 ring-4 ring-white/30 shadow-lg">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold text-lg">
                        {user.displayName ? getInitials(user.displayName) : user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate drop-shadow-sm">
                        {user.displayName || 'Welcome!'}
                      </h3>
                      <p className="text-sm text-white/80 truncate">
                        {user.email}
                      </p>
                      {user.metadata?.creationTime && (
                        <div className="flex items-center mt-1 text-xs text-white/60">
                          <Clock className="h-3 w-3 mr-1" />
                          Joined {formatJoinDate(user.metadata.creationTime)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  {/* Account Section */}
                  <div className="px-3 py-2">
                    <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                      Account
                    </h4>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 hover:bg-white/10 rounded-lg transition-all duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-4 w-4 mr-3 text-white/70" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-white">Profile Settings</span>
                        <span className="text-xs text-white/60">Manage your account</span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 hover:bg-white/10 rounded-lg transition-all duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <Mail className="h-4 w-4 mr-3 text-white/70" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-white">Email Preferences</span>
                        <span className="text-xs text-white/60">Notification settings</span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 hover:bg-white/10 rounded-lg transition-all duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <Shield className="h-4 w-4 mr-3 text-white/70" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-white">Privacy & Security</span>
                        <span className="text-xs text-white/60">Manage your data</span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 hover:bg-white/10 rounded-lg transition-all duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-3 text-white/70" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-white">App Settings</span>
                        <span className="text-xs text-white/60">Customize your experience</span>
                      </div>
                    </Button>
                  </div>

                  <Separator className="my-3 bg-white/20" />

                  {/* Logout Button */}
                  <div className="px-1 pb-2">
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start h-auto p-3 hover:bg-red-500/20 hover:text-red-300 text-white rounded-lg transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">Sign Out</span>
                        <span className="text-xs opacity-75">See you next time!</span>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
