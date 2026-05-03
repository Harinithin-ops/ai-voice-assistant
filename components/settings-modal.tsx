"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Mail, Shield, Settings as SettingsIcon, Save, Key, LayoutTemplate } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth/auth-context"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export type SettingsTab = "profile" | "email" | "privacy" | "app"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: SettingsTab
}

export function SettingsModal({ isOpen, onClose, defaultTab = "profile" }: SettingsModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab)
  const [saving, setSaving] = useState(false)

  // Sync default tab when modal opens
  if (!isOpen) return null

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      onClose()
    }, 800)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-4xl h-[85vh] max-h-[800px] z-10 p-4"
      >
        <Card className="w-full h-full overflow-hidden border-gray-700/50 shadow-2xl bg-gray-950/90 backdrop-blur-xl flex flex-col rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50">
            <div>
              <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Account Settings</h2>
              <p className="text-gray-400 text-sm mt-1">Manage your account preferences and settings</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-800 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            <Tabs 
              value={activeTab} 
              onValueChange={(val) => setActiveTab(val as SettingsTab)}
              className="flex flex-col md:flex-row w-full h-full"
            >
              {/* Sidebar */}
              <div className="md:w-64 border-r border-gray-800 bg-gray-900/30 p-4 overflow-y-auto">
                <TabsList className="flex md:flex-col flex-row w-full h-auto bg-transparent p-0 gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                  <TabsTrigger 
                    value="profile" 
                    className="w-full justify-start gap-3 p-3 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300 data-[state=active]:border-indigo-500/50 border border-transparent rounded-xl transition-all"
                  >
                    <User className="w-4 h-4" />
                    Profile Settings
                  </TabsTrigger>
                  <TabsTrigger 
                    value="email" 
                    className="w-full justify-start gap-3 p-3 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 data-[state=active]:border-blue-500/50 border border-transparent rounded-xl transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    Email Preferences
                  </TabsTrigger>
                  <TabsTrigger 
                    value="privacy" 
                    className="w-full justify-start gap-3 p-3 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-500/50 border border-transparent rounded-xl transition-all"
                  >
                    <Shield className="w-4 h-4" />
                    Privacy & Security
                  </TabsTrigger>
                  <TabsTrigger 
                    value="app" 
                    className="w-full justify-start gap-3 p-3 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 data-[state=active]:border-purple-500/50 border border-transparent rounded-xl transition-all"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    App Settings
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-900/10">
                {/* PROFILE TAB */}
                <TabsContent value="profile" className="mt-0 h-full animate-in fade-in slide-in-from-right-4 duration-300 outline-none">
                  <div className="max-w-2xl mx-auto space-y-8 pb-8">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-6">Profile Information</h3>
                      
                      <div className="flex items-center gap-6 mb-8">
                        <Avatar className="h-24 w-24 ring-4 ring-indigo-500/30">
                          <AvatarImage src={user?.photoURL || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white">
                            {user?.displayName ? getInitials(user.displayName) : user?.email?.[0].toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Button variant="outline" className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white mr-3">Change Avatar</Button>
                          <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">Remove</Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="displayName" className="text-gray-300">Display Name</Label>
                          <Input id="displayName" defaultValue={user?.displayName || ''} className="bg-gray-800/50 border-gray-700 text-white focus-visible:ring-indigo-500" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                          <Input id="email" defaultValue={user?.email || ''} disabled className="bg-gray-900/50 border-gray-800 text-gray-400 opacity-70" />
                          <p className="text-xs text-gray-500">Your email address is managed by your authentication provider.</p>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                          <textarea id="bio" rows={3} placeholder="Tell us a little about yourself" className="w-full rounded-md bg-gray-800/50 border border-gray-700 text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* EMAIL TAB */}
                <TabsContent value="email" className="mt-0 h-full animate-in fade-in slide-in-from-right-4 duration-300 outline-none">
                  <div className="max-w-2xl mx-auto space-y-8 pb-8">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-6">Email Preferences</h3>
                      <p className="text-gray-400 text-sm mb-6">Manage what types of emails you receive from VoiceAI.</p>
                      
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-800/20 hover:bg-gray-800/40 transition-colors">
                          <div className="space-y-0.5">
                            <Label className="text-base text-white">Product Updates</Label>
                            <p className="text-sm text-gray-400">Receive emails about new features and updates.</p>
                          </div>
                          <Switch defaultChecked className="data-[state=checked]:bg-blue-500" />
                        </div>
                        
                        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-800/20 hover:bg-gray-800/40 transition-colors">
                          <div className="space-y-0.5">
                            <Label className="text-base text-white">Security Alerts</Label>
                            <p className="text-sm text-gray-400">Important notifications about your account security.</p>
                          </div>
                          <Switch defaultChecked disabled className="data-[state=checked]:bg-blue-500 opacity-50" />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-800/20 hover:bg-gray-800/40 transition-colors">
                          <div className="space-y-0.5">
                            <Label className="text-base text-white">Marketing & Offers</Label>
                            <p className="text-sm text-gray-400">Occasional promotional emails and exclusive offers.</p>
                          </div>
                          <Switch className="data-[state=checked]:bg-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* PRIVACY TAB */}
                <TabsContent value="privacy" className="mt-0 h-full animate-in fade-in slide-in-from-right-4 duration-300 outline-none">
                  <div className="max-w-2xl mx-auto space-y-8 pb-8">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-6">Privacy & Security</h3>
                      
                      <div className="space-y-6">
                        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                          <div className="flex items-center gap-3 mb-2">
                            <Key className="w-5 h-5 text-emerald-400" />
                            <h4 className="font-medium text-emerald-300">Password & Authentication</h4>
                          </div>
                          <p className="text-sm text-gray-400 mb-4">Update your password or enable multi-factor authentication.</p>
                          <Button variant="outline" className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white">Change Password</Button>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Data Privacy</h4>
                          
                          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-800/20 hover:bg-gray-800/40 transition-colors">
                            <div className="space-y-0.5 flex-1 pr-4">
                              <Label className="text-base text-white">Analytics Sharing</Label>
                              <p className="text-sm text-gray-400">Help us improve by sharing anonymous usage data.</p>
                            </div>
                            <Switch defaultChecked className="data-[state=checked]:bg-emerald-500" />
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-800/20 hover:bg-gray-800/40 transition-colors">
                            <div className="space-y-0.5 flex-1 pr-4">
                              <Label className="text-base text-white">Voice Data Processing</Label>
                              <p className="text-sm text-gray-400">Allow local processing of voice commands for faster response times.</p>
                            </div>
                            <Switch defaultChecked className="data-[state=checked]:bg-emerald-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* APP TAB */}
                <TabsContent value="app" className="mt-0 h-full animate-in fade-in slide-in-from-right-4 duration-300 outline-none">
                  <div className="max-w-2xl mx-auto space-y-8 pb-8">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-6">App Settings</h3>
                      
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Appearance</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="border-2 border-purple-500 rounded-xl p-4 bg-gray-900 cursor-pointer text-center relative overflow-hidden transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                              <div className="absolute top-2 right-2 w-3 h-3 bg-purple-500 rounded-full" />
                              <LayoutTemplate className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                              <span className="text-sm font-medium text-white">Dark Mode</span>
                            </div>
                            <div className="border border-gray-700 rounded-xl p-4 bg-gray-100 cursor-pointer text-center opacity-50 hover:opacity-100 transition-opacity">
                              <LayoutTemplate className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                              <span className="text-sm font-medium text-gray-900">Light Mode</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Localization</h4>
                          <div className="grid gap-2">
                            <Label className="text-gray-300">Language</Label>
                            <select className="w-full rounded-md bg-gray-800/50 border border-gray-700 text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                              <option>English (US)</option>
                              <option>English (UK)</option>
                              <option>Spanish</option>
                              <option>French</option>
                              <option>German</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-800 bg-gray-900/80 flex justify-end gap-3 rounded-b-2xl">
            <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-gray-800">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white min-w-[120px] shadow-lg shadow-indigo-500/25"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </div>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
