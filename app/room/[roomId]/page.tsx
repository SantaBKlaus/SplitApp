'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    subscribeToRoom,
    subscribeToItems,
    addItem,
    toggleItemSelection,
    submitSelections,
    leaveRoom,
    updateRoomTaxProfiles,
    updateItemTaxProfile,
    Room,
    BillItem,
    TaxProfile,
    updateRoomServiceTax,
    deleteItem,
    deleteRoom,
} from '@/lib/firebase/firestore';
import { calculateTotalBill, calculateUserShare, formatCurrency, calculateItemTax, calculateTotalTax, calculateTotalServiceCharge, calculateSubtotal } from '@/lib/calculations';
import {
    Plus, Check, LogOut, Copy, Users, DollarSign, Receipt, Minus, X, Building2, ChevronDown, Percent, Coins, CreditCard, Wallet, Landmark, Sparkles, Coffee, Beer, Utensils,
    ShoppingBag, Car, Plane, Gift, Music, Film, Gamepad, Shirt, Scissors, Stethoscope, GraduationCap, Briefcase, Globe, Layers, ChevronUp, Download, Sun, Moon, Trash2, AlertTriangle
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useRef } from 'react';
import { bauhausBtn, bauhausCard, container, modal } from '@/lib/animations';

const ICON_MAP: Record<string, any> = {
    Percent, DollarSign, Coins, CreditCard, Wallet, Landmark, Receipt, Sparkles, Coffee, Beer, Utensils,
    ShoppingBag, Car, Plane, Gift, Music, Film, Gamepad, Shirt, Scissors, Stethoscope, GraduationCap, Briefcase
};

const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, 2000);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsVisible(false);
    };

    return (
        <div className="relative flex items-center" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-neutral-800 border border-white/10 rounded-none text-xs text-white whitespace-nowrap z-50 shadow-xl"
                    >
                        {content}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-800" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const CustomTaxDropdown = ({
    selectedProfileId,
    options,
    onSelect,
    disabled
}: {
    selectedProfileId?: string;
    options: TaxProfile[];
    onSelect: (id: string) => void;
    disabled?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const selectedProfile = options.find(p => p.id === selectedProfileId);
    const globalProfile = options.find(p => p.isGlobal);

    // If no profile selected, show Global default if exists, else generic
    const effectiveProfile = selectedProfile || globalProfile;
    const Icon = ICON_MAP[effectiveProfile?.icon || ''] || (effectiveProfile ? Percent : Building2);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceNeeded = 400; // Approx max height of dropdown
            const showAbove = spaceBelow < spaceNeeded;

            setDropdownStyle({
                top: showAbove ? 'auto' : rect.bottom + 8,
                bottom: showAbove ? window.innerHeight - rect.top + 8 : 'auto',
                left: rect.right - 256, // 256px is w-64
                width: 256,
                transformOrigin: showAbove ? 'bottom right' : 'top right'
            });
        }
    }, [isOpen]);

    const toggleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!disabled) setIsOpen(!isOpen);
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={toggleOpen}
                className={`flex items-center justify-center w-8 h-8 border-2 border-[var(--border-color)] transition-all shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-none ${selectedProfileId
                    ? 'bg-bauhaus-yellow text-bauhaus-dark'
                    : 'bg-[var(--card-bg)] text-foreground hover:bg-black/5 dark:hover:bg-white/10'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <Icon className="w-4 h-4" />
            </button>

            {isOpen && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-[9998]"
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: dropdownStyle.top === 'auto' ? 10 : -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: dropdownStyle.top === 'auto' ? 10 : -10 }}
                                style={{ position: 'fixed', ...dropdownStyle }}
                                className="z-[9999] bg-[var(--card-bg)] border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--shadow-color)] overflow-hidden rounded-none"
                            >
                                <div className="p-2 space-y-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onSelect('none'); setIsOpen(false); }}
                                        className={`w-full flex items-center gap-3 p-2 border-2 border-transparent hover:border-[var(--border-color)] transition-all rounded-none ${!selectedProfileId ? 'bg-[var(--card-bg)] border-[var(--border-color)]' : 'hover:bg-black/5 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="w-8 h-8 bg-[var(--card-bg)] border-2 border-[var(--border-color)] flex items-center justify-center rounded-none">
                                            <Building2 className="w-4 h-4 text-foreground" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-foreground">Default (Global)</p>
                                            <p className="text-xs text-foreground/60">Use room default</p>
                                        </div>
                                        {!selectedProfileId && <Check className="w-4 h-4 text-foreground ml-auto" />}
                                    </button>

                                    <div className="h-0.5 bg-[var(--border-color)] my-1" />

                                    {options.map(profile => {
                                        const ProfileIcon = ICON_MAP[profile.icon || ''] || Percent;
                                        const isSelected = selectedProfileId === profile.id;
                                        return (
                                            <button
                                                key={profile.id}
                                                onClick={(e) => { e.stopPropagation(); onSelect(profile.id); setIsOpen(false); }}
                                                className={`w-full flex items-center gap-3 p-2 border-2 border-transparent hover:border-[var(--border-color)] transition-all rounded-none ${isSelected ? 'bg-bauhaus-yellow border-[var(--border-color)]' : 'hover:bg-black/5 dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 flex items-center justify-center border-2 border-[var(--border-color)] rounded-none ${isSelected ? 'bg-white text-bauhaus-dark' : 'bg-[var(--card-bg)] text-foreground'
                                                    }`}>
                                                    <ProfileIcon className="w-4 h-4" />
                                                </div>
                                                <div className="text-left">
                                                    <p className={`text-sm font-bold ${isSelected ? 'text-bauhaus-dark' : 'text-foreground'}`}>
                                                        {profile.name}
                                                    </p>
                                                    <p className={`text-xs ${isSelected ? 'text-bauhaus-dark/80' : 'text-foreground/60'}`}>{profile.rate}% • {profile.isDouble ? 'Double' : 'Single'}</p>
                                                </div>
                                                {isSelected && <Check className="w-4 h-4 text-bauhaus-dark ml-auto" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const [room, setRoom] = useState<Room | null>(null);
    const [items, setItems] = useState<BillItem[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);
    const [copiedShareLink, setCopiedShareLink] = useState(false);

    // Tax Profile State
    const [showTaxPanel, setShowTaxPanel] = useState(false);
    const [serviceTaxRate, setServiceTaxRate] = useState(0);
    const [newProfileName, setNewProfileName] = useState('');
    const [newProfileRate, setNewProfileRate] = useState('');
    const [newProfileIcon, setNewProfileIcon] = useState('Percent');
    const [expandIcons, setExpandIcons] = useState(false);
    const [showDangerZone, setShowDangerZone] = useState(false);

    const roomId = typeof params?.roomId === 'string' ? params.roomId : '';

    useEffect(() => {
        if (!user) {
            router.push(`/join/${roomId}`);
            return;
        }

        if (!roomId) return;

        const unsubscribeRoom = subscribeToRoom(roomId, (roomData) => {
            setRoom(roomData);
            if (roomData.serviceTaxRate !== undefined) {
                setServiceTaxRate(roomData.serviceTaxRate);
            }
        });

        const unsubscribeItems = subscribeToItems(roomId, (itemsData) => {
            setItems(itemsData);
        });

        return () => {
            unsubscribeRoom();
            unsubscribeItems();
        };
    }, [roomId, user, router]);

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName || !newItemPrice || !user) return;

        try {
            await addItem(roomId, newItemName, parseFloat(newItemPrice), user.uid, undefined, newItemQuantity);
            setNewItemName('');
            setNewItemPrice('');
            setNewItemQuantity(1);
            setShowAddItem(false);
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await deleteItem(roomId, itemId);
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const handleToggleSelection = async (itemId: string) => {
        if (!user) return;
        try {
            await toggleItemSelection(roomId, itemId, user.uid);
        } catch (error) {
            console.error('Error toggling selection:', error);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await submitSelections(roomId, user.uid);
        } catch (error) {
            console.error('Error submitting:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateServiceTax = async (value: string) => {
        // Allow empty string for temporary deletion
        if (value === '') {
            setServiceTaxRate(0);
            try {
                await updateRoomServiceTax(roomId, 0);
            } catch (error) {
                console.error('Error updating service tax:', error);
            }
            return;
        }

        const rate = Number(value);
        if (!isNaN(rate) && rate >= 0) {
            setServiceTaxRate(rate);
            try {
                await updateRoomServiceTax(roomId, rate);
            } catch (error) {
                console.error('Error updating service tax:', error);
            }
        }
    };

    const handleCreateProfile = async () => {
        if (!room || !newProfileName || !newProfileRate) return;
        const newProfile: TaxProfile = {
            id: Date.now().toString(),
            name: newProfileName,
            rate: parseFloat(newProfileRate),
            isGlobal: false,
            isDouble: false,
            icon: newProfileIcon
        };
        const updatedProfiles = [...room.taxProfiles, newProfile];
        await updateRoomTaxProfiles(roomId, updatedProfiles);
        setNewProfileName('');
        setNewProfileRate('');
    };

    const handleToggleGlobal = async (profileId: string) => {
        if (!room) return;
        const updatedProfiles = room.taxProfiles.map(p => ({
            ...p,
            isGlobal: p.id === profileId ? !p.isGlobal : false
        }));
        await updateRoomTaxProfiles(roomId, updatedProfiles);
    };

    const handleToggleDouble = async (profileId: string) => {
        if (!room) return;
        const updatedProfiles = room.taxProfiles.map(p => ({
            ...p,
            isDouble: p.id === profileId ? !p.isDouble : p.isDouble
        }));
        await updateRoomTaxProfiles(roomId, updatedProfiles);
    };

    const handleCopyCode = () => {
        if (room?.code) {
            navigator.clipboard.writeText(room.code);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleShareLink = () => {
        const text = `Join my Split Room: ${room?.name || 'Bill Split'}\nCode: ${room?.code}\nLink: ${window.location.href}`;
        if (navigator.share) {
            navigator.share({
                title: room?.name || 'Split Bill',
                text: text,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text);
            setCopiedShareLink(true);
            setTimeout(() => setCopiedShareLink(false), 2000);
        }
    };

    const handleBackButton = async () => {
        if (!user) {
            router.push('/history');
            return;
        }

        // If guest user, delete account and leave room
        if (user.isAnonymous) {
            try {
                await leaveRoom(roomId, user.uid);
                const { deleteUserAccount } = await import('@/lib/firebase/auth');
                await deleteUserAccount(user);
                router.push('/');
            } catch (error) {
                console.error('Error handling guest exit:', error);
                router.push('/history');
            }
        } else {
            router.push('/history');
        }
    };

    const handleLeaveRoom = async () => {
        if (!user || !confirm('Are you sure you want to leave this room?')) return;
        try {
            await leaveRoom(roomId, user.uid);

            // Check if this is a guest user
            if (user.isAnonymous) {
                // Import getUserRooms and deleteUserAccount
                const { getUserRooms } = await import('@/lib/firebase/firestore');
                const { deleteUserAccount } = await import('@/lib/firebase/auth');

                const userRooms = await getUserRooms(user.uid);
                const hasActiveRooms = userRooms.some(r =>
                    r.participants.some(p => p.userId === user.uid)
                );

                // If no active rooms, delete the guest account
                if (!hasActiveRooms) {
                    await deleteUserAccount(user);
                    router.push('/');
                    return;
                }
            }

            router.push('/history');
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    };

    const handleDeleteRoom = async () => {
        if (!confirm('Are you sure? This will delete the room and all data for everyone.')) return;
        try {
            await deleteRoom(roomId);
            router.push('/');
        } catch (error) {
            console.error('Error deleting room:', error);
        }
    };

    const totalBill = room ? calculateTotalBill(items, room.taxProfiles, serviceTaxRate) : 0;
    const userShare = user && room ? calculateUserShare(items, user.uid, room.taxProfiles, serviceTaxRate) : 0;
    const currentParticipant = room?.participants.find(p => p.userId === user?.uid);
    const hasUserSelectedItems = items.some(item => item.selectedBy.includes(user?.uid || ''));

    if (!room) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-none h-12 w-12 border-b-2 border-black"></div></div>;

    return (
        <div className={`min-h-screen transition-colors duration-300 bg-background`}>
            {/* Header */}
            <header className="bg-bauhaus-yellow/90 backdrop-blur-md border-b-4 border-black dark:border-white p-4 sticky top-0 z-50 shadow-[0px_4px_0px_0px_var(--shadow-color)] transition-all">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                        <button onClick={handleBackButton} className="p-2 bg-white dark:bg-neutral-800 border-2 border-black dark:border-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all rounded-none">
                            <ChevronDown className="w-6 h-6 rotate-90 text-black dark:text-white" />
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-bauhaus-dark uppercase tracking-tighter truncate max-w-[200px] sm:max-w-none">{room.name || 'Room'}</h1>
                            <div className="flex items-center gap-2 text-sm font-bold text-bauhaus-dark/80">
                                <span className="bg-white/50 px-2 py-0.5 border border-black/20 rounded-none">{room.code}</span>
                                <button onClick={handleCopyCode} className="hover:text-black transition-colors">
                                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                        <button
                            onClick={() => setShowTaxPanel(true)}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-neutral-800 border-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors font-bold uppercase rounded-none shadow-[2px_2px_0px_0px_var(--shadow-color)]"
                        >
                            <Building2 className="w-5 h-5 text-black dark:text-white" />
                            <span className="text-black dark:text-white text-sm hidden sm:inline">Tax</span>
                        </button>
                        {!user?.isAnonymous && (
                            <button
                                onClick={() => setShowDangerZone(true)}
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500 border-2 border-black dark:border-white hover:bg-red-600 transition-colors font-bold uppercase rounded-none shadow-[2px_2px_0px_0px_var(--shadow-color)]"
                                title="Danger Zone"
                            >
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </button>
                        )}
                        <button
                            onClick={handleShareLink}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-bauhaus-dark text-white border-2 border-black dark:border-white font-bold hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all rounded-none uppercase shadow-[2px_2px_0px_0px_var(--shadow-color)]"
                        >
                            <Download className="w-5 h-5" />
                            <span className="text-sm hidden sm:inline">Share</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4 pb-32">
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column: Items */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Add Item Form */}
                        <motion.div variants={bauhausCard} initial="hidden" animate="visible" className="bauhaus-card p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-2">
                                    <Receipt className="w-6 h-6" /> Bill Items
                                </h2>
                                <button onClick={() => setShowAddItem(!showAddItem)} className="lg:hidden p-2 bg-bauhaus-dark text-background rounded-none">
                                    {showAddItem ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className={`${showAddItem ? 'block' : 'hidden'} lg:block`}>
                                <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        placeholder="Item Name"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        className="bauhaus-input flex-grow"
                                    />
                                    <div className="flex gap-2">
                                        <div className="flex transition-all duration-200 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:-translate-y-[2px] hover:-translate-x-[2px]">
                                            <button
                                                type="button"
                                                onClick={() => setNewItemQuantity(Math.max(1, newItemQuantity - 1))}
                                                className="px-2 bg-[var(--card-bg)] border-2 border-r-0 border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center rounded-none"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                value={newItemQuantity}
                                                onChange={(e) => setNewItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-12 text-center bg-[var(--input-bg)] border-2 border-[var(--border-color)] font-bold focus:outline-none text-[var(--foreground)] p-3 rounded-none"
                                                min="1"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setNewItemQuantity(newItemQuantity + 1)}
                                                className="px-2 bg-[var(--card-bg)] border-2 border-l-0 border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center rounded-none"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            value={newItemPrice}
                                            onChange={(e) => setNewItemPrice(e.target.value)}
                                            className="bauhaus-input w-full sm:w-28"
                                            step="0.01"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newItemName || !newItemPrice}
                                            className="bauhaus-button px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ADD
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>

                        {/* Items List */}
                        <div className="space-y-4">
                            <AnimatePresence>
                                {items.map((item) => {
                                    const isSelected = item.selectedBy.includes(user?.uid || '');
                                    const taxProfile = room.taxProfiles.find(p => p.id === item.taxProfileId);
                                    const globalProfile = room.taxProfiles.find(p => p.isGlobal);
                                    const effectiveProfile = taxProfile || globalProfile;
                                    const itemTotal = item.price * (item.quantity || 1);

                                    return (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className={`p-4 border-2 border-[var(--border-color)] transition-all shadow-[4px_4px_0px_0px_var(--shadow-color)] rounded-none ${isSelected
                                                ? 'bg-bauhaus-yellow dark:bg-bauhaus-yellow'
                                                : 'bg-[var(--card-bg)]'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-grow flex items-center gap-4 cursor-pointer" onClick={() => handleToggleSelection(item.id)}>
                                                    <div className={`w-8 h-8 border-2 border-[var(--border-color)] flex items-center justify-center transition-colors rounded-none ${isSelected ? 'bg-[var(--bauhaus-dark)] text-[var(--background)]' : 'bg-[var(--card-bg)]'}`}>
                                                        {isSelected && <Check className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <h3 className={`font-bold text-lg ${isSelected ? 'text-bauhaus-dark' : 'text-foreground'}`}>{item.name}</h3>
                                                        <div className="flex items-center gap-2 text-sm opacity-70">
                                                            <span className={isSelected ? 'text-bauhaus-dark' : 'text-foreground'}>
                                                                {item.quantity && item.quantity > 1 ? `${item.quantity} x ` : ''}{formatCurrency(item.price, room.currency)}
                                                                {item.quantity && item.quantity > 1 ? ` = ${formatCurrency(itemTotal, room.currency)}` : ''}
                                                            </span>
                                                            {effectiveProfile && (
                                                                <span className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-1.5 rounded-none text-xs font-bold border border-black/10 dark:border-white/10">
                                                                    {effectiveProfile.name} ({effectiveProfile.rate}%)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex -space-x-2 mt-2">
                                                            {item.selectedBy.map((userId) => {
                                                                const participant = room.participants.find(p => p.userId === userId);
                                                                return (
                                                                    <div key={userId} className="w-6 h-6 rounded-none bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-foreground" title={participant?.displayName}>
                                                                        {participant?.displayName?.[0]}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <CustomTaxDropdown
                                                        selectedProfileId={item.taxProfileId}
                                                        options={room.taxProfiles}
                                                        onSelect={(id) => updateItemTaxProfile(roomId, item.id, id === 'none' ? undefined : id)}
                                                    />
                                                    {item.addedBy === user?.uid && (
                                                        <button
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none transition-colors"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            {items.length === 0 && (
                                <div className="text-center py-12 bg-white/50 border-2 border-dashed border-black/20 rounded-none">
                                    <p className="text-bauhaus-dark/40 font-bold">No items yet. Add one above!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Players & Stats */}
                    <div className="space-y-6">
                        {/* Players Card */}
                        <div className="bg-bauhaus-blue border-4 border-[var(--border-color)] p-6 shadow-[8px_8px_0px_0px_var(--shadow-color)] text-white rounded-none">
                            <h2 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                                <Users className="w-6 h-6" /> Players ({room.participants.length})
                            </h2>
                            {/* Miro-style stacked avatar list */}
                            <div className="flex items-center -space-x-3">
                                {room.participants.map((participant, index) => (
                                    <div key={participant.userId} className="group relative" style={{ zIndex: room.participants.length - index }}>
                                        <div className="relative">
                                            {participant.photoURL ? (
                                                <img
                                                    src={participant.photoURL}
                                                    alt={participant.displayName}
                                                    className="w-12 h-12 rounded-full border-4 border-bauhaus-blue object-cover hover:border-white hover:scale-110 transition-all cursor-pointer"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-white text-bauhaus-blue font-black flex items-center justify-center border-4 border-bauhaus-blue hover:border-white hover:scale-110 transition-all cursor-pointer text-lg">
                                                    {participant.displayName[0]}
                                                </div>
                                            )}
                                            {participant.hasSubmitted && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-bauhaus-blue flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-bauhaus-dark" />
                                                </div>
                                            )}
                                        </div>
                                        {/* Tooltip on hover */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-xs font-bold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                            {participant.displayName}
                                            {participant.hasSubmitted && ' ✓'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Your Share Card */}
                        <div className="bg-bauhaus-red border-4 border-[var(--border-color)] p-6 shadow-[8px_8px_0px_0px_var(--shadow-color)] text-white rounded-none">
                            <h2 className="text-xl font-black uppercase mb-2">Your Share</h2>
                            <div className="text-4xl font-black mb-6">
                                {formatCurrency(userShare, room.currency)}
                            </div>

                            {!currentParticipant?.hasSubmitted ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !hasUserSelectedItems}
                                    className="w-full bg-white text-bauhaus-red border-2 border-[var(--border-color)] font-black py-3 shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none uppercase rounded-none hover:-translate-y-0.5 hover:-translate-x-0.5"
                                >
                                    {isSubmitting ? 'Submitting...' : "I'm Done"}
                                </button>
                            ) : (
                                <div className="bg-white/20 border-2 border-white/40 p-3 text-center font-bold rounded-none">
                                    <Check className="w-6 h-6 mx-auto mb-1" />
                                    WAITING FOR OTHERS
                                </div>
                            )}
                        </div>

                        {/* Total Bill Card with Breakdown */}
                        <div className="bg-[var(--card-bg)] border-4 border-[var(--border-color)] p-6 shadow-[8px_8px_0px_0px_var(--shadow-color)] rounded-none">
                            <h2 className="text-xl font-black uppercase mb-4 text-foreground">Total Bill</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center pb-3 border-b-2 border-[var(--border-color)]">
                                    <span className="text-sm font-bold text-foreground/60">Subtotal</span>
                                    <span className="text-lg font-black text-foreground">{formatCurrency(calculateSubtotal(items), room.currency)}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b-2 border-[var(--border-color)]">
                                    <span className="text-sm font-bold text-foreground/60">Tax</span>
                                    <span className="text-lg font-black text-foreground">{formatCurrency(calculateTotalTax(items, room.taxProfiles), room.currency)}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b-2 border-[var(--border-color)]">
                                    <span className="text-sm font-bold text-foreground/60">Service Charge</span>
                                    <span className="text-lg font-black text-foreground">{formatCurrency(calculateTotalServiceCharge(items, room.taxProfiles, serviceTaxRate), room.currency)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-lg font-black text-foreground uppercase">Total</span>
                                    <span className="text-3xl font-black text-foreground">{formatCurrency(totalBill, room.currency)}</span>
                                </div>
                            </div>
                        </div>


                    </div>
                </div >
            </main >

            {/* Government Modal */}
            {
                typeof document !== 'undefined' && createPortal(
                    <AnimatePresence>
                        {showTaxPanel && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowTaxPanel(false)}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                />
                                <motion.div
                                    variants={modal}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="bg-[var(--card-bg)] border-2 border-[var(--border-color)] p-6 w-[95%] max-w-md max-h-[90vh] overflow-y-auto relative z-10 shadow-[8px_8px_0px_0px_var(--shadow-color)] rounded-none"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-black text-foreground flex items-center gap-2 uppercase">
                                            <Building2 className="w-6 h-6" />
                                            The Government
                                        </h2>
                                        <button
                                            onClick={() => setShowTaxPanel(false)}
                                            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-none transition-colors"
                                        >
                                            <X className="w-6 h-6 text-foreground" />
                                        </button>
                                    </div>

                                    {/* Service Tax Setting */}
                                    <div className="bg-[var(--card-bg)] border-2 border-[var(--border-color)] p-4 mb-6 shadow-[4px_4px_0px_0px_var(--shadow-color)] rounded-none">
                                        <h3 className="text-sm font-bold text-foreground uppercase mb-3 flex items-center gap-2">
                                            <Receipt className="w-4 h-4" /> Service Tax
                                        </h3>
                                        <p className="text-xs text-foreground/60 mb-3">
                                            Applied on top of item total + tax.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={serviceTaxRate}
                                                onChange={(e) => handleUpdateServiceTax(e.target.value)}
                                                className="bauhaus-input w-24 text-center font-bold"
                                                min="0"
                                                step="0.5"
                                            />
                                            <span className="font-bold text-foreground">%</span>
                                        </div>
                                    </div>

                                    {/* Add New Profile */}
                                    <div className="bg-[var(--card-bg)] border-2 border-[var(--border-color)] p-4 mb-6 shadow-[4px_4px_0px_0px_var(--shadow-color)] rounded-none">
                                        <h3 className="text-sm font-bold text-foreground uppercase mb-3">Add Tax Profile</h3>
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-2 transition-all duration-300 ease-in-out">
                                                {Object.keys(ICON_MAP).slice(0, expandIcons ? undefined : 6).map(iconKey => {
                                                    const Icon = ICON_MAP[iconKey];
                                                    return (
                                                        <button
                                                            key={iconKey}
                                                            onClick={() => setNewProfileIcon(iconKey)}
                                                            className={`w-10 h-10 flex items-center justify-center border-2 border-[var(--border-color)] transition-all rounded-none ${newProfileIcon === iconKey
                                                                ? 'bg-bauhaus-yellow text-bauhaus-dark shadow-[2px_2px_0px_0px_var(--shadow-color)]'
                                                                : 'bg-[var(--card-bg)] text-foreground/40 hover:bg-black/5 dark:hover:bg-white/5'
                                                                }`}
                                                        >
                                                            <Icon className="w-5 h-5" />
                                                        </button>
                                                    );
                                                })}
                                                <button
                                                    onClick={() => setExpandIcons(!expandIcons)}
                                                    className="w-10 h-10 flex items-center justify-center border-2 border-[var(--border-color)] bg-[var(--bauhaus-dark)] text-[var(--background)] hover:bg-black/80 transition-all shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-none"
                                                >
                                                    {expandIcons ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                placeholder="Name (e.g. GST)"
                                                value={newProfileName}
                                                onChange={(e) => setNewProfileName(e.target.value)}
                                                className="bauhaus-input flex-1 text-sm"
                                            />
                                            <input
                                                type="number"
                                                placeholder="%"
                                                value={newProfileRate}
                                                onChange={(e) => setNewProfileRate(e.target.value)}
                                                className="bauhaus-input w-20 text-center text-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={handleCreateProfile}
                                            disabled={!newProfileName.trim() || !newProfileRate}
                                            className="w-full bg-bauhaus-blue text-white border-2 border-[var(--border-color)] text-sm font-bold py-2 transition-all disabled:opacity-50 shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-none"
                                        >
                                            ADD PROFILE
                                        </button>
                                    </div>

                                    {/* Profile List */}
                                    <div className="space-y-3 pr-2">
                                        {room.taxProfiles?.map((profile) => {
                                            const ProfileIcon = ICON_MAP[profile.icon || ''] || Percent;
                                            return (
                                                <div key={profile.id} className="bg-[var(--card-bg)] border-2 border-[var(--border-color)] p-4 shadow-[4px_4px_0px_0px_var(--shadow-color)] rounded-none">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-[var(--card-bg)] flex items-center justify-center text-foreground border-2 border-[var(--border-color)] rounded-none">
                                                                <ProfileIcon className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-foreground">{profile.name}</p>
                                                                <p className="text-sm text-foreground/60 font-bold">{profile.rate}% Tax Rate</p>
                                                            </div>
                                                        </div>
                                                        {profile.isGlobal && (
                                                            <span className="bg-bauhaus-blue text-white text-xs font-bold px-2 py-1 border-2 border-[var(--border-color)] rounded-none">
                                                                GLOBAL
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Tooltip content="Apply this tax to all items by default (Global)">
                                                            <button
                                                                onClick={() => handleToggleGlobal(profile.id)}
                                                                className={`w-10 h-10 flex items-center justify-center border-2 border-[var(--border-color)] transition-all rounded-none ${profile.isGlobal
                                                                    ? 'bg-bauhaus-blue text-white shadow-[2px_2px_0px_0px_var(--shadow-color)]'
                                                                    : 'bg-[var(--card-bg)] text-foreground/40 hover:bg-black/5 dark:hover:bg-white/5'
                                                                    }`}
                                                            >
                                                                <Globe className="w-5 h-5" />
                                                            </button>
                                                        </Tooltip>

                                                        <Tooltip content="Apply tax on top of other taxes (Center & State)">
                                                            <button
                                                                onClick={() => handleToggleDouble(profile.id)}
                                                                className={`w-10 h-10 flex items-center justify-center border-2 border-[var(--border-color)] transition-all rounded-none ${profile.isDouble
                                                                    ? 'bg-bauhaus-yellow text-bauhaus-dark shadow-[2px_2px_0px_0px_var(--shadow-color)]'
                                                                    : 'bg-[var(--card-bg)] text-foreground/40 hover:bg-black/5 dark:hover:bg-white/5'
                                                                    }`}
                                                            >
                                                                <Layers className="w-5 h-5" />
                                                            </button>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body
                )
            }

            {/* Danger Zone Modal */}
            {
                typeof document !== 'undefined' && createPortal(
                    <AnimatePresence>
                        {showDangerZone && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowDangerZone(false)}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                />
                                <motion.div
                                    variants={modal}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="bg-[var(--card-bg)] border-2 border-[var(--border-color)] p-6 w-full max-w-md relative z-10 shadow-[8px_8px_0px_0px_var(--shadow-color)] rounded-none"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-black text-foreground flex items-center gap-2 uppercase">
                                            <AlertTriangle className="w-6 h-6 text-red-500" />
                                            Danger Zone
                                        </h2>
                                        <button
                                            onClick={() => setShowDangerZone(false)}
                                            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-none transition-colors"
                                        >
                                            <X className="w-6 h-6 text-foreground" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {!user?.isAnonymous && (
                                            <button
                                                onClick={() => {
                                                    setShowDangerZone(false);
                                                    handleLeaveRoom();
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-[var(--border-color)] text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-none shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]"
                                            >
                                                <LogOut className="w-5 h-5" />
                                                <span>Leave Room</span>
                                            </button>
                                        )}
                                        {user?.uid === room.createdBy && (
                                            <button
                                                onClick={() => {
                                                    setShowDangerZone(false);
                                                    handleDeleteRoom();
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 bg-red-500 border-2 border-[var(--border-color)] text-white font-bold hover:bg-red-600 transition-colors rounded-none shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                                <span>Delete Room</span>
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body
                )
            }
        </div >
    );
}
