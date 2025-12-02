'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    subscribeToRoom,
    subscribeToItems,
    addItem,
    toggleItemSelection,
    toggleSubmissionStatus,
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
import html2canvas from 'html2canvas';
import { ReceiptCard } from '@/components/ReceiptCard';
import { calculateTotalBill, calculateUserShare, formatCurrency, calculateItemTax, calculateTotalTax, calculateTotalServiceCharge, calculateSubtotal } from '@/lib/calculations';
import {
    Plus, Check, LogOut, Copy, Users, DollarSign, Receipt, Minus, X, Building2, ChevronDown, Percent, Coins, CreditCard, Wallet, Landmark, Sparkles, Coffee, Beer, Utensils,
    ShoppingBag, Car, Plane, Gift, Music, Film, Gamepad, Shirt, Scissors, Stethoscope, GraduationCap, Briefcase, Globe, Layers, ChevronUp, Download, Sun, Moon, Trash2, AlertTriangle, ScanLine, ArrowLeft
} from 'lucide-react';
import ReceiptScanner from '@/components/ReceiptScanner';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
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
                                                    <p className={`text-xs ${isSelected ? 'text-bauhaus-dark/80' : 'text-foreground/60'}`}>{profile.rate}% Tax Rate</p>
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
    const [showScanner, setShowScanner] = useState(false);

    // Receipt Download State
    const [isDownloading, setIsDownloading] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

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

    const handleScanComplete = async (scannedItems: any[], scannedServiceTax: number, scannedTaxProfiles: any[]) => {
        if (!user) return;

        // Add all items
        for (const item of scannedItems) {
            try {
                await addItem(roomId, item.name, item.price, user.uid, undefined, item.quantity);
            } catch (error) {
                console.error('Error adding scanned item:', error);
            }
        }

        // Update service tax if detected and different
        if (scannedServiceTax > 0 && scannedServiceTax !== serviceTaxRate) {
            handleUpdateServiceTax(scannedServiceTax.toString());
        }

        // Add detected tax profiles
        if (scannedTaxProfiles && scannedTaxProfiles.length > 0 && room) {
            const currentProfiles = room.taxProfiles || [];
            const newProfiles: TaxProfile[] = [];

            for (const scannedProfile of scannedTaxProfiles) {
                // Check if profile with same name exists (case-insensitive)
                const exists = currentProfiles.some(p => p.name.toLowerCase() === scannedProfile.name.toLowerCase());
                if (!exists) {
                    newProfiles.push({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        name: scannedProfile.name,
                        rate: scannedProfile.rate,
                        isGlobal: scannedProfile.isGlobal,
                        isDouble: true, // Default to true as per requirements
                        icon: 'Percent' // Default icon
                    });
                }
            }

            if (newProfiles.length > 0 && room) {
                try {
                    await updateRoomTaxProfiles(roomId, [...currentProfiles, ...newProfiles]);
                } catch (error) {
                    console.error('Error adding scanned tax profiles:', error);
                }
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
            isDouble: true,
            icon: newProfileIcon
        };
        const updatedProfiles = [...(room.taxProfiles || []), newProfile];
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

    const handleDeleteProfile = async (profileId: string) => {
        if (!room) return;
        const updatedProfiles = room.taxProfiles.filter(p => p.id !== profileId);
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
        if (navigator.share) {
            navigator.share({
                title: `Join ${room?.name || 'Split Bill Room'}`,
                text: `Join my room to split the bill! Code: ${room?.code}`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            setCopiedShareLink(true);
            setTimeout(() => setCopiedShareLink(false), 2000);
        }
    };

    const handleToggleSubmit = async () => {
        if (!user || !room) return;
        setIsSubmitting(true);
        try {
            const participant = room.participants.find(p => p.userId === user.uid);
            const newStatus = !participant?.hasSubmitted;
            await toggleSubmissionStatus(roomId, user.uid, newStatus);
        } catch (error) {
            console.error('Error toggling submission:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLeaveRoom = async () => {
        if (!user || !roomId) return;
        if (confirm('Are you sure you want to leave this room?')) {
            try {
                await leaveRoom(roomId, user.uid);
                router.push('/');
            } catch (error) {
                console.error('Error leaving room:', error);
            }
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

    const handleDownloadReceipt = async () => {
        if (!receiptRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2, // Higher quality
                backgroundColor: '#ffffff',
                logging: false,
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `split-bill-receipt-${room?.code || 'room'}.png`;
            link.click();
        } catch (error) {
            console.error('Error downloading receipt:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    if (!room || !user) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-bauhaus-blue"></div>
            </div>
        );
    }

    const currentParticipant = room.participants.find(p => p.userId === user.uid);
    const userShare = calculateUserShare(items, user.uid, room.taxProfiles, room.serviceTaxRate);
    const hasUserSelectedItems = items.some(item => item.selectedBy.includes(user.uid));
    const isSubmitted = currentParticipant?.hasSubmitted || false;
    const totalBill = calculateTotalBill(items, room.taxProfiles, serviceTaxRate);

    return (
        <div className="min-h-screen bg-[var(--background)] pb-24 sm:pb-8 transition-colors duration-300">
            {/* Mobile Header */}
            <header className="lg:hidden sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-md border-b-2 border-[var(--border-color)] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/')} className="p-2 -ml-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                        <LogOut className="w-5 h-5 text-foreground" />
                    </button>
                    <div>
                        <h1 className="font-black text-lg text-foreground leading-tight truncate max-w-[150px]">{room.name || 'Room'}</h1>
                        <button onClick={handleCopyCode} className="flex items-center gap-1 text-xs font-bold text-foreground/60 active:text-foreground transition-colors">
                            Code: {room.code}
                            {copiedCode ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleShareLink}
                        className="p-2 bg-bauhaus-blue text-white border-2 border-[var(--border-color)] shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-none"
                    >
                        {copiedShareLink ? <Check className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => setShowScanner(true)}
                        disabled={isSubmitted}
                        className="p-2 bg-bauhaus-yellow text-bauhaus-dark border-2 border-[var(--border-color)] shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ScanLine className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowTaxPanel(true)}
                        disabled={isSubmitted}
                        className="p-2 bg-[var(--card-bg)] border-2 border-[var(--border-color)] text-foreground shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Percent className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowDangerZone(true)}
                        className="p-2 bg-red-500 text-white border-2 border-[var(--border-color)] shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-none"
                    >
                        <AlertTriangle className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4 sm:p-8 pt-4 sm:pt-8">
                {/* Desktop Header */}
                <div className="hidden lg:flex justify-between items-start mb-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-4 mb-2"
                        >
                            <button
                                onClick={() => router.push('/')}
                                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                title="Back to Home"
                            >
                                <ArrowLeft className="w-8 h-8 text-foreground" />
                            </button>
                            <h1 className="text-4xl sm:text-5xl font-black text-foreground uppercase tracking-tight">
                                {room.name || 'Split Bill'}
                            </h1>
                        </motion.div>
                        <div className="flex items-center gap-4">
                            <div className="bg-[var(--card-bg)] px-4 py-2 border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--shadow-color)] flex items-center gap-3 rounded-none">
                                <span className="font-bold text-foreground/60 text-sm uppercase">Room Code</span>
                                <span className="font-black text-xl text-foreground tracking-widest">{room.code}</span>
                                <button onClick={handleCopyCode} className="hover:text-bauhaus-blue transition-colors relative">
                                    {copiedCode ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                            <button
                                onClick={handleShareLink}
                                className="bg-bauhaus-blue text-white px-4 py-2 border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all font-bold flex items-center gap-2 rounded-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            >
                                {copiedShareLink ? <Check className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                INVITE
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowScanner(true)}
                            disabled={isSubmitted}
                            className="bg-bauhaus-yellow text-bauhaus-dark px-4 py-2 border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all font-bold flex items-center gap-2 rounded-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                        >
                            <ScanLine className="w-5 h-5" />
                            SCAN RECEIPT
                        </button>
                        <button
                            onClick={() => setShowTaxPanel(true)}
                            disabled={isSubmitted}
                            className="bg-[var(--card-bg)] text-foreground px-4 py-2 border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all font-bold flex items-center gap-2 rounded-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                        >
                            <Percent className="w-5 h-5" />
                            TAXES
                        </button>
                        <button
                            onClick={() => setShowDangerZone(true)}
                            className="bg-red-500 text-white px-4 py-2 border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all font-bold flex items-center gap-2 rounded-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        >
                            <AlertTriangle className="w-5 h-5" />
                            DANGER ZONE
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Items */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Add Item Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-[var(--card-bg)] border-4 border-[var(--border-color)] p-6 shadow-[8px_8px_0px_0px_var(--shadow-color)] rounded-none ${isSubmitted ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-black uppercase flex items-center gap-2 text-foreground">
                                    <Receipt className="w-6 h-6" /> Add Items
                                </h2>
                                <button
                                    onClick={() => setShowAddItem(!showAddItem)}
                                    className="lg:hidden p-2 bg-[var(--card-bg)] border-2 border-[var(--border-color)] rounded-none"
                                >
                                    {showAddItem ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className={`${showAddItem ? 'block' : 'hidden'} lg:block`}>
                                <form onSubmit={handleAddItem}>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="text"
                                            placeholder="Item Name"
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            className="bauhaus-input flex-grow"
                                        />
                                        <div className="flex items-center group hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-shadow border-2 border-[var(--border-color)] rounded-none">
                                            <button
                                                type="button"
                                                onClick={() => setNewItemQuantity(Math.max(1, newItemQuantity - 1))}
                                                className="w-12 h-12 bg-[var(--card-bg)] border-r border-[var(--border-color)] group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors flex items-center justify-center rounded-none"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <input
                                                type="number"
                                                value={newItemQuantity}
                                                onChange={(e) => setNewItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-12 h-12 text-center bg-[var(--input-bg)] border-r border-[var(--border-color)] font-bold focus:outline-none text-[var(--foreground)] rounded-none"
                                                min="1"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setNewItemQuantity(newItemQuantity + 1)}
                                                className="w-12 h-12 bg-[var(--card-bg)] group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors flex items-center justify-center rounded-none"
                                            >
                                                <Plus className="w-4 h-4" />
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
                                                } ${isSubmitted ? 'opacity-70' : ''}`}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className={`flex-grow flex items-center gap-4 ${isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => !isSubmitted && handleToggleSelection(item.id)}>
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
                                                                effectiveProfile.isDouble ? (
                                                                    <>
                                                                        <span className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-1.5 rounded-none text-xs font-bold border border-black/10 dark:border-white/10">
                                                                            CGST ({effectiveProfile.rate}%)
                                                                        </span>
                                                                        <span className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-1.5 rounded-none text-xs font-bold border border-black/10 dark:border-white/10">
                                                                            SGST ({effectiveProfile.rate}%)
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-1.5 rounded-none text-xs font-bold border border-black/10 dark:border-white/10">
                                                                        {effectiveProfile.name} ({effectiveProfile.rate}%)
                                                                    </span>
                                                                )
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
                                                        disabled={isSubmitted}
                                                    />
                                                    {item.addedBy === user?.uid && (
                                                        <button
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            disabled={isSubmitted}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                            <button
                                onClick={handleToggleSubmit}
                                disabled={isSubmitting || (!hasUserSelectedItems && !isSubmitted)}
                                className={`w-full border-2 border-[var(--border-color)] font-black py-3 shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none uppercase rounded-none hover:-translate-y-0.5 hover:-translate-x-0.5 ${isSubmitted ? 'bg-white text-bauhaus-red' : 'bg-white text-bauhaus-red'}`}
                            >
                                {isSubmitting ? 'Updating...' : (isSubmitted ? "I'm Not Done" : "I'm Done")}
                            </button>

                            {hasUserSelectedItems && (
                                <button
                                    onClick={handleDownloadReceipt}
                                    disabled={isDownloading}
                                    className="w-full mt-3 flex items-center justify-center gap-2 bg-bauhaus-yellow text-bauhaus-dark border-2 border-[var(--border-color)] font-black py-3 shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none uppercase rounded-none hover:-translate-y-0.5 hover:-translate-x-0.5"
                                >
                                    {isDownloading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-bauhaus-dark"></div>
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    Download Receipt
                                </button>
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

                                                        <Tooltip content="Apply both CGST and SGST">
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

                                                        <button
                                                            onClick={() => handleDeleteProfile(profile.id)}
                                                            className="w-10 h-10 flex items-center justify-center border-2 border-[var(--border-color)] bg-[var(--card-bg)] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all rounded-none"
                                                            title="Delete Profile"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
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

            {/* Receipt Scanner Modal */}
            {
                showScanner && (
                    <ReceiptScanner
                        onScanComplete={handleScanComplete}
                        onClose={() => setShowScanner(false)}
                    />
                )
            }

            {/* Hidden Receipt Card for Capture */}
            <div className="fixed left-[-9999px] top-0">
                {room && user && (
                    <ReceiptCard
                        ref={receiptRef}
                        room={room}
                        items={items}
                        userId={user.uid}
                        userName={room.participants.find(p => p.userId === user.uid)?.displayName || 'Guest'}
                    />
                )}
            </div>
        </div>
    );
}
