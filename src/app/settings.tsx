import { authService } from '@/services/auth.service';
import { rtdb } from '@/services/firebase';
import { router } from 'expo-router';
import { get as dbGet, ref as dbRef, remove as dbRemove, set as dbSet } from 'firebase/database';
import { ArrowLeft, Bell, Briefcase, Calendar, ChevronRight, Coins, Globe, Hash, Moon, Plus, Settings as SettingsIcon, Shield, Trash2, Users, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ScreenTopBar } from '@/components/screen-top-bar';

interface Workspace {
    id: string;
    name: string;
    type: string;
    members: number;
    active: boolean;
}

export default function SettingsScreen() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [newWorkspaceType, setNewWorkspaceType] = useState<'business' | 'personal'>('business');
    const [loading, setLoading] = useState(true);
    const [dateSystem, setDateSystem] = useState('BS');
    const [numberFormat, setNumberFormat] = useState('Intl');
    const [language, setLanguage] = useState('English');
    const [currency, setCurrency] = useState('NPR (Rs)');

    const user = authService.getCurrentUser();

    useEffect(() => {
        loadWorkspaces();
    }, []);

    const loadWorkspaces = async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }
        try {
            const snap = await dbGet(dbRef(rtdb, `workspaces`));
            if (snap.exists()) {
                const data = snap.val();
                const list = Object.entries(data)
                    .filter(([_, val]: [string, any]) => val.ownerId === user.uid || val.collaborators?.[user.uid])
                    .map(([id, val]: [string, any]) => ({
                        id,
                        name: val.name,
                        type: val.type,
                        members: val.collaborators ? Object.keys(val.collaborators).length : 0,
                        active: val.ownerId === user.uid && user.activeWorkspaceId === id,
                    }));
                setWorkspaces(list);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const createWorkspace = async () => {
        if (!user?.uid || !newWorkspaceName.trim()) return;
        const workspaceId = `ws_${Date.now()}`;
        const timestamp = Date.now();
        await dbSet(dbRef(rtdb, `workspaces/${workspaceId}`), {
            name: newWorkspaceName,
            ownerId: user.uid,
            type: newWorkspaceType,
            createdAt: timestamp,
            updatedAt: timestamp,
        });
        await dbSet(dbRef(rtdb, `workspaces/${workspaceId}/collaborators/${user.uid}`), {
            role: 'owner',
            joinedAt: timestamp,
            name: user.ownerName,
            email: user.email,
        });
        setNewWorkspaceName('');
        setShowCreateWorkspace(false);
        loadWorkspaces();
    };

    const switchWorkspace = async (workspaceId: string) => {
        if (!user?.uid) return;
        await dbSet(dbRef(rtdb, `users/${user.uid}/activeWorkspaceId`), workspaceId);
        loadWorkspaces();
    };

    const deleteWorkspace = async (workspaceId: string) => {
        Alert.alert('Delete Workspace', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await dbRemove(dbRef(rtdb, `workspaces/${workspaceId}`));
                    loadWorkspaces();
                },
            },
        ]);
    };

    const preferences = [
        { icon: SettingsIcon, label: 'Account Settings', onPress: () => { } },
        { icon: Bell, label: 'Notifications', onPress: () => router.push('/notifications' as any) },
        { icon: Shield, label: 'Security', onPress: () => { } },
    ];

    if (loading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-text-muted" style={{ fontFamily: 'DMSans_400Regular' }}>Loading...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <ScreenTopBar>
                <View className="flex-row items-center">
                <Pressable onPress={() => router.back()} className="mr-3">
                    <ArrowLeft size={24} color="#ffffff" />
                </Pressable>
                <Text className="text-white text-xl font-bold" style={{ fontFamily: 'DMSans_700Bold' }}>
                    Settings
                </Text>
                </View>
            </ScreenTopBar>

            <ScrollView className="flex-1 px-4">
                {/* Workspaces Section */}
                <View className="flex-row justify-between items-center mt-4 mb-3">
                    <Text className="text-text-secondary text-sm" style={{ fontFamily: 'DMSans_500Medium' }}>
                        Workspaces
                    </Text>
                    <Pressable onPress={() => setShowCreateWorkspace(true)} className="flex-row items-center">
                        <Plus size={16} color="#8b7cf7" />
                        <Text className="text-primary text-sm ml-1" style={{ fontFamily: 'DMSans_500Medium' }}>
                            New
                        </Text>
                    </Pressable>
                </View>

                {/* Create Workspace Form */}
                {showCreateWorkspace && (
                    <View className="bg-surface rounded-2xl p-4 border border-border mb-3">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-white font-medium" style={{ fontFamily: 'DMSans_500Medium' }}>
                                New Workspace
                            </Text>
                            <Pressable onPress={() => setShowCreateWorkspace(false)}>
                                <X size={18} color="#6b7280" />
                            </Pressable>
                        </View>
                        <TextInput
                            className="bg-surface-light rounded-xl px-4 py-3 text-white border border-border mb-3"
                            placeholder="Company / org / personal name"
                            placeholderTextColor="#6b7280"
                            value={newWorkspaceName}
                            onChangeText={setNewWorkspaceName}
                            style={{ fontFamily: 'DMSans_400Regular' }}
                        />
                        <View className="flex-row mb-3">
                            <Pressable
                                onPress={() => setNewWorkspaceType('business')}
                                className={`flex-1 rounded-xl py-2 items-center mr-2 border ${newWorkspaceType === 'business' ? 'bg-primary border-primary' : 'bg-surface-light border-border'}`}
                            >
                                <Text className={newWorkspaceType === 'business' ? 'text-white' : 'text-text-muted'} style={{ fontFamily: 'DMSans_500Medium' }}>
                                    Business
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setNewWorkspaceType('personal')}
                                className={`flex-1 rounded-xl py-2 items-center ml-2 border ${newWorkspaceType === 'personal' ? 'bg-primary border-primary' : 'bg-surface-light border-border'}`}
                            >
                                <Text className={newWorkspaceType === 'personal' ? 'text-white' : 'text-text-muted'} style={{ fontFamily: 'DMSans_500Medium' }}>
                                    Personal
                                </Text>
                            </Pressable>
                        </View>
                        <View className="flex-row">
                            <Pressable onPress={() => setShowCreateWorkspace(false)} className="flex-1 bg-surface-light border border-border rounded-xl py-3 items-center mr-2">
                                <Text className="text-white" style={{ fontFamily: 'DMSans_500Medium' }}>Cancel</Text>
                            </Pressable>
                            <Pressable onPress={createWorkspace} className="flex-1 bg-primary rounded-xl py-3 items-center">
                                <Text className="text-white" style={{ fontFamily: 'DMSans_500Medium' }}>Create</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Workspaces List */}
                {workspaces.length === 0 ? (
                    <View className="bg-surface rounded-2xl p-6 border border-border mb-3 items-center">
                        <Briefcase size={24} color="#6b7280" />
                        <Text className="text-text-secondary mt-2" style={{ fontFamily: 'DMSans_400Regular' }}>
                            No workspaces yet
                        </Text>
                        <Pressable onPress={() => setShowCreateWorkspace(true)} className="mt-2">
                            <Text className="text-primary" style={{ fontFamily: 'DMSans_500Medium' }}>
                                Create your first workspace
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    workspaces.map((workspace) => (
                        <View
                            key={workspace.id}
                            className={`bg-surface rounded-2xl p-4 border mb-3 ${workspace.active ? 'border-primary' : 'border-border'
                                }`}
                        >
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                                        <Briefcase size={18} color="#8b7cf7" />
                                    </View>
                                    <View>
                                        <Text className="text-white font-medium" style={{ fontFamily: 'DMSans_500Medium' }}>
                                            {workspace.name}
                                        </Text>
                                        <Text className="text-text-muted text-xs" style={{ fontFamily: 'DMSans_400Regular' }}>
                                            {workspace.type} · {workspace.members} Members
                                        </Text>
                                    </View>
                                </View>
                                <View className="flex-row items-center">
                                    {workspace.active ? (
                                        <View className="bg-primary/20 rounded-full px-3 py-1">
                                            <Text className="text-primary text-xs" style={{ fontFamily: 'DMSans_500Medium' }}>
                                                ACTIVE
                                            </Text>
                                        </View>
                                    ) : (
                                        <Pressable
                                            onPress={() => switchWorkspace(workspace.id)}
                                            className="bg-surface-light rounded-lg px-3 py-1 border border-border mr-2"
                                        >
                                            <Text className="text-white text-xs" style={{ fontFamily: 'DMSans_500Medium' }}>
                                                Switch
                                            </Text>
                                        </Pressable>
                                    )}
                                    <Pressable onPress={() => deleteWorkspace(workspace.id)}>
                                        <Trash2 size={18} color="#ef4444" />
                                    </Pressable>
                                </View>
                            </View>

                            {workspace.active && (
                                <View className="mt-3 pt-3 border-t border-border">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-white text-sm" style={{ fontFamily: 'DMSans_500Medium' }}>
                                            Team
                                        </Text>
                                        <Pressable className="flex-row items-center">
                                            <Users size={14} color="#8b7cf7" />
                                            <Text className="text-primary text-sm ml-1" style={{ fontFamily: 'DMSans_500Medium' }}>
                                                Invite
                                            </Text>
                                        </Pressable>
                                    </View>
                                    <Text className="text-text-muted text-xs mt-1" style={{ fontFamily: 'DMSans_400Regular' }}>
                                        {workspace.members <= 1 ? 'No team members yet.' : `${workspace.members - 1} team members`}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))
                )}

                {/* Preferences Section */}
                <Text className="text-text-secondary text-sm mt-6 mb-3" style={{ fontFamily: 'DMSans_500Medium' }}>
                    Preferences
                </Text>

                {preferences.map((pref, index) => (
                    <Pressable
                        key={index}
                        onPress={pref.onPress}
                        className="bg-surface rounded-2xl p-4 border border-border mb-3 flex-row items-center"
                    >
                        <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                            <pref.icon size={18} color="#8b7cf7" />
                        </View>
                        <Text className="text-white flex-1" style={{ fontFamily: 'DMSans_500Medium' }}>
                            {pref.label}
                        </Text>
                        <ChevronRight size={18} color="#6b7280" />
                    </Pressable>
                ))}

                {/* Theme Toggle */}
                <View className="bg-surface rounded-2xl p-4 border border-border mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                            <Moon size={18} color="#8b7cf7" />
                        </View>
                        <View>
                            <Text className="text-white" style={{ fontFamily: 'DMSans_500Medium' }}>
                                Theme
                            </Text>
                            <Text className="text-text-muted text-xs" style={{ fontFamily: 'DMSans_400Regular' }}>
                                Dark Mode
                            </Text>
                        </View>
                    </View>
                    <View className="bg-surface-light rounded-full p-1">
                        <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
                            <Moon size={16} color="#ffffff" />
                        </View>
                    </View>
                </View>

                {/* Date System */}
                <View className="bg-surface rounded-2xl p-4 border border-border mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                            <Calendar size={18} color="#8b7cf7" />
                        </View>
                        <View>
                            <Text className="text-white" style={{ fontFamily: 'DMSans_500Medium' }}>
                                Date System
                            </Text>
                            <Text className="text-text-muted text-xs" style={{ fontFamily: 'DMSans_400Regular' }}>
                                Bikram Sambat
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row bg-surface-light rounded-lg p-1">
                        <Pressable
                            onPress={() => setDateSystem('BS')}
                            className={`px-3 py-1 rounded-md ${dateSystem === 'BS' ? 'bg-primary' : ''}`}
                        >
                            <Text className={`text-sm ${dateSystem === 'BS' ? 'text-white' : 'text-text-muted'}`} style={{ fontFamily: 'DMSans_500Medium' }}>
                                BS
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setDateSystem('AD')}
                            className={`px-3 py-1 rounded-md ${dateSystem === 'AD' ? 'bg-primary' : ''}`}
                        >
                            <Text className={`text-sm ${dateSystem === 'AD' ? 'text-white' : 'text-text-muted'}`} style={{ fontFamily: 'DMSans_500Medium' }}>
                                AD
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* Number Format */}
                <View className="bg-surface rounded-2xl p-4 border border-border mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                            <Hash size={18} color="#8b7cf7" />
                        </View>
                        <View>
                            <Text className="text-white" style={{ fontFamily: 'DMSans_500Medium' }}>
                                Number Format
                            </Text>
                            <Text className="text-text-muted text-xs" style={{ fontFamily: 'DMSans_400Regular' }}>
                                International
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row bg-surface-light rounded-lg p-1">
                        <Pressable
                            onPress={() => setNumberFormat('Deva')}
                            className={`px-3 py-1 rounded-md ${numberFormat === 'Deva' ? 'bg-primary' : ''}`}
                        >
                            <Text className={`text-sm ${numberFormat === 'Deva' ? 'text-white' : 'text-text-muted'}`} style={{ fontFamily: 'DMSans_500Medium' }}>
                                Deva
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setNumberFormat('Intl')}
                            className={`px-3 py-1 rounded-md ${numberFormat === 'Intl' ? 'bg-primary' : ''}`}
                        >
                            <Text className={`text-sm ${numberFormat === 'Intl' ? 'text-white' : 'text-text-muted'}`} style={{ fontFamily: 'DMSans_500Medium' }}>
                                Intl
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* Language */}
                <View className="bg-surface rounded-2xl p-4 border border-border mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                            <Globe size={18} color="#8b7cf7" />
                        </View>
                        <View>
                            <Text className="text-white" style={{ fontFamily: 'DMSans_500Medium' }}>
                                Language
                            </Text>
                            <Text className="text-text-muted text-xs" style={{ fontFamily: 'DMSans_400Regular' }}>
                                {language}
                            </Text>
                        </View>
                    </View>
                    <Pressable className="bg-surface-light rounded-lg px-3 py-2 border border-border flex-row items-center">
                        <Text className="text-white text-sm mr-2" style={{ fontFamily: 'DMSans_500Medium' }}>
                            {language}
                        </Text>
                        <ChevronRight size={16} color="#6b7280" />
                    </Pressable>
                </View>

                {/* Currency */}
                <View className="bg-surface rounded-2xl p-4 border border-border mb-6 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                            <Coins size={18} color="#8b7cf7" />
                        </View>
                        <View>
                            <Text className="text-white" style={{ fontFamily: 'DMSans_500Medium' }}>
                                Currency
                            </Text>
                            <Text className="text-text-muted text-xs" style={{ fontFamily: 'DMSans_400Regular' }}>
                                Nepali Rupee (Rs)
                            </Text>
                        </View>
                    </View>
                    <Pressable className="bg-surface-light rounded-lg px-3 py-2 border border-border flex-row items-center">
                        <Text className="text-white text-sm mr-2" style={{ fontFamily: 'DMSans_500Medium' }}>
                            {currency}
                        </Text>
                        <ChevronRight size={16} color="#6b7280" />
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}