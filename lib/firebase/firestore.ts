import {
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    onSnapshot,
    query,
    serverTimestamp,
    Timestamp,
    getDocs,
    deleteField,
    where,
    deleteDoc,
} from 'firebase/firestore';
import { db } from './config';

// Types
export interface TaxProfile {
    id: string;
    name: string;
    rate: number; // Percentage (e.g., 6 for 6%)
    isGlobal: boolean;
    isDouble: boolean; // "Center & State" - applies tax twice
    icon: string;
}

export interface RoomParticipant {
    userId: string;
    displayName: string;
    isGuest: boolean;
    joinedAt: Timestamp;
    hasSubmitted: boolean;
    photoURL?: string;
}

export interface BillItem {
    id: string;
    name: string;
    price: number;
    addedBy: string;
    selectedBy: string[];
    createdAt: Timestamp;
    taxProfileId?: string;
    quantity?: number;
}

export interface Room {
    id: string;
    code: string;
    name?: string;
    createdAt: Timestamp;
    createdBy: string;
    status: 'active' | 'completed';
    participants: RoomParticipant[];
    leftParticipants?: RoomParticipant[];
    expiresAt?: Timestamp | null;
    taxProfiles: TaxProfile[];
    currency?: string;
    serviceTaxRate?: number;
    participantIds: string[]; // For efficient querying
}

// Generate 8-letter room code
export const generateRoomCode = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
};

// Create a new room
export const createRoom = async (userId: string, displayName: string, roomName?: string, currency: string = 'USD', photoURL?: string) => {
    try {
        const roomRef = doc(collection(db, 'rooms'));
        const roomId = roomRef.id;
        const code = generateRoomCode();

        const defaultTaxProfiles: TaxProfile[] = [
            { id: 'general', name: 'General', rate: 6, isGlobal: false, isDouble: false, icon: 'Coins' },
            { id: 'special', name: 'Special', rate: 18, isGlobal: false, isDouble: false, icon: 'CreditCard' },
            { id: 'luxe', name: 'Luxe', rate: 40, isGlobal: false, isDouble: false, icon: 'Sparkles' }
        ];

        const roomData: Room = {
            id: roomId,
            code,
            name: roomName,
            createdAt: serverTimestamp() as Timestamp,
            createdBy: userId,
            status: 'active',
            currency,
            serviceTaxRate: 0,
            participants: [
                {
                    userId,
                    displayName,
                    isGuest: false,
                    joinedAt: Timestamp.now(),
                    hasSubmitted: false,
                    ...(photoURL && { photoURL }),
                },
            ],
            participantIds: [userId],
            taxProfiles: defaultTaxProfiles,
        };

        await setDoc(roomRef, roomData);
        return { roomId, code };
    } catch (error) {
        console.error('Error creating room:', error);
        throw error;
    }
};

// Join an existing room
export const joinRoom = async (
    roomId: string,
    userId: string,
    displayName: string,
    isGuest: boolean,
    photoURL?: string
) => {
    try {
        const roomRef = doc(db, 'rooms', roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            throw new Error('Room not found');
        }

        const roomData = roomSnap.data() as Room;
        const isAlreadyParticipant = roomData.participants.some(p => p.userId === userId);

        if (isAlreadyParticipant) {
            return roomData;
        }

        const participant: RoomParticipant = {
            userId,
            displayName,
            isGuest,
            joinedAt: Timestamp.now(),
            hasSubmitted: false,
            ...(photoURL && { photoURL }),
        };

        await updateDoc(roomRef, {
            participants: arrayUnion(participant),
            participantIds: arrayUnion(userId),
            expiresAt: deleteField(), // Clear expiration if room was empty
        });

        return roomSnap.data() as Room;
    } catch (error) {
        console.error('Error joining room:', error);
        throw error;
    }
};

// Leave a room
export const leaveRoom = async (roomId: string, userId: string) => {
    try {
        const roomRef = doc(db, 'rooms', roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            throw new Error('Room not found');
        }

        const room = roomSnap.data() as Room;
        const participant = room.participants.find(p => p.userId === userId);

        if (!participant) {
            return; // User not in room
        }

        // Remove the participant and add to leftParticipants
        const updatedParticipants = room.participants.filter(p => p.userId !== userId);
        const leftParticipants = room.leftParticipants || [];
        const updatedLeftParticipants = [...leftParticipants, participant];

        // Check if room is now empty
        if (updatedParticipants.length === 0) {
            // Set expiration to 30 minutes from now
            const expiresAt = Timestamp.fromMillis(Date.now() + 30 * 60 * 1000);
            await updateDoc(roomRef, {
                participants: updatedParticipants,
                leftParticipants: updatedLeftParticipants,
                expiresAt,
            });
        } else {
            // Remove expiration if it was set
            await updateDoc(roomRef, {
                participants: updatedParticipants,
                leftParticipants: updatedLeftParticipants,
                // We keep the user in participantIds so they can still see it in history as a "past room"
                // or we could remove them if we want it gone from history.
                // For now, let's keep them in participantIds so it shows in history.
                expiresAt: deleteField(),
            });
        }

        // Check if this is a guest user and if they have no other rooms
        if (participant.isGuest) {
            const userRooms = await getUserRooms(userId);
            // If user has no active rooms (only left rooms or empty), delete their account
            const hasActiveRooms = userRooms.some(r =>
                r.participants.some(p => p.userId === userId)
            );

            if (!hasActiveRooms) {
                // Delete the guest user account from Firebase Auth
                // Note: This requires the user's auth instance, which we don't have here
                // So we'll handle this client-side when they leave
                console.log(`Guest user ${userId} has no active rooms and should be deleted`);
            }
        }
    } catch (error) {
        console.error('Error leaving room:', error);
        throw error;
    }
};

// Get room by code
export const getRoomByCode = async (code: string) => {
    try {
        const roomsRef = collection(db, 'rooms');
        const q = query(roomsRef);
        const snapshot = await getDocs(q);

        const room = snapshot.docs
            .map(doc => doc.data() as Room)
            .find(r => r.code === code.toUpperCase());

        if (!room) {
            throw new Error('Room not found');
        }

        return room;
    } catch (error) {
        console.error('Error getting room by code:', error);
        throw error;
    }
};

// Get room data
export const getRoom = async (roomId: string) => {
    try {
        const roomRef = doc(db, 'rooms', roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            throw new Error('Room not found');
        }

        return roomSnap.data() as Room;
    } catch (error) {
        console.error('Error getting room:', error);
        throw error;
    }
};

// Add an item to the room
export const addItem = async (roomId: string, name: string, price: number, addedBy: string, taxProfileId?: string, quantity: number = 1) => {
    try {
        const itemRef = doc(collection(db, 'rooms', roomId, 'items'));
        const itemId = itemRef.id;

        const itemData: BillItem = {
            id: itemId,
            name,
            price,
            addedBy,
            selectedBy: [],
            createdAt: serverTimestamp() as Timestamp,
            ...(taxProfileId && { taxProfileId }),
            quantity,
        };

        await setDoc(itemRef, itemData);
        return itemId;
    } catch (error) {
        console.error('Error adding item:', error);
        throw error;
    }
};
// Delete an item from the room
export const deleteItem = async (roomId: string, itemId: string) => {
    try {
        const itemRef = doc(db, 'rooms', roomId, 'items', itemId);
        await deleteDoc(itemRef);
    } catch (error) {
        console.error('Error deleting item:', error);
        throw error;
    }
};

export const updateRoomServiceTax = async (roomId: string, rate: number) => {
    try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
            serviceTaxRate: rate
        });
    } catch (error) {
        console.error('Error updating service tax:', error);
        throw error;
    }
};

// Update participant display name
export const updateParticipantName = async (roomId: string, userId: string, newDisplayName: string) => {
    try {
        const roomRef = doc(db, 'rooms', roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            throw new Error('Room not found');
        }

        const room = roomSnap.data() as Room;
        const updatedParticipants = room.participants.map((p) =>
            p.userId === userId ? { ...p, displayName: newDisplayName } : p
        );

        await updateDoc(roomRef, {
            participants: updatedParticipants,
        });
    } catch (error) {
        console.error('Error updating participant name:', error);
        throw error;
    }
};

// Update item's tax profile
export const updateItemTaxProfile = async (roomId: string, itemId: string, taxProfileId: string | undefined) => {
    try {
        const itemRef = doc(db, 'rooms', roomId, 'items', itemId);
        await updateDoc(itemRef, {
            taxProfileId: taxProfileId || deleteField(),
        });
    } catch (error) {
        console.error('Error updating item tax profile:', error);
        throw error;
    }
};

// Update room's tax profiles
export const updateRoomTaxProfiles = async (roomId: string, taxProfiles: TaxProfile[]) => {
    try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
            taxProfiles,
        });
    } catch (error) {
        console.error('Error updating room tax profiles:', error);
        throw error;
    }
};

// Toggle item selection for a user
export const toggleItemSelection = async (roomId: string, itemId: string, userId: string) => {
    try {
        const itemRef = doc(db, 'rooms', roomId, 'items', itemId);
        const itemSnap = await getDoc(itemRef);

        if (!itemSnap.exists()) {
            throw new Error('Item not found');
        }

        const item = itemSnap.data() as BillItem;
        const isSelected = item.selectedBy.includes(userId);

        if (isSelected) {
            await updateDoc(itemRef, {
                selectedBy: arrayRemove(userId),
            });
        } else {
            await updateDoc(itemRef, {
                selectedBy: arrayUnion(userId),
            });
        }
    } catch (error) {
        console.error('Error toggling item selection:', error);
        throw error;
    }
};

// Toggle user's submission status
export const toggleSubmissionStatus = async (roomId: string, userId: string, status: boolean) => {
    try {
        const roomRef = doc(db, 'rooms', roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            throw new Error('Room not found');
        }

        const room = roomSnap.data() as Room;
        const updatedParticipants = room.participants.map((p) =>
            p.userId === userId ? { ...p, hasSubmitted: status } : p
        );

        await updateDoc(roomRef, {
            participants: updatedParticipants,
        });

        // Check if all participants have submitted (only if status is true)
        if (status) {
            const allSubmitted = updatedParticipants.every((p) => p.hasSubmitted);
            if (allSubmitted) {
                // Set expiration to 15 days from now
                const expiresAt = Timestamp.fromMillis(Date.now() + 15 * 24 * 60 * 60 * 1000);
                await updateDoc(roomRef, {
                    status: 'completed',
                    expiresAt,
                });
            }
        } else {
            // If un-submitting, ensure room is active (if it was completed)
            if (room.status === 'completed') {
                await updateDoc(roomRef, {
                    status: 'active',
                    expiresAt: deleteField(),
                });
            }
        }

        return status;
    } catch (error) {
        console.error('Error toggling submission status:', error);
        throw error;
    }
};

// Real-time listener for room updates
export const subscribeToRoom = (roomId: string, callback: (room: Room) => void) => {
    const roomRef = doc(db, 'rooms', roomId);
    return onSnapshot(roomRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data() as Room);
        }
    });
};

// Real-time listener for items
export const subscribeToItems = (roomId: string, callback: (items: BillItem[]) => void) => {
    const itemsRef = collection(db, 'rooms', roomId, 'items');
    const itemsQuery = query(itemsRef);

    return onSnapshot(itemsQuery, (snapshot) => {
        const items = snapshot.docs.map((doc) => doc.data() as BillItem);
        callback(items);
    });
};

// Get all rooms where user is a participant
export const getUserRooms = async (userId: string) => {
    try {
        const roomsRef = collection(db, 'rooms');

        // Try new efficient query first
        const q = query(roomsRef, where('participantIds', 'array-contains', userId));
        const snapshot = await getDocs(q);

        let userRooms = snapshot.docs.map(doc => doc.data() as Room);

        // Fallback for old rooms without participantIds (optional, but good for migration period)
        if (userRooms.length === 0) {
            const allQ = query(roomsRef);
            const allSnapshot = await getDocs(allQ);
            userRooms = allSnapshot.docs
                .map(doc => doc.data() as Room)
                .filter(room =>
                    room.createdBy === userId ||
                    room.participants.some(p => p.userId === userId) ||
                    room.leftParticipants?.some(p => p.userId === userId)
                );
        }

        return userRooms.sort((a, b) => {
            const aTime = a.createdAt?.toMillis() || 0;
            const bTime = b.createdAt?.toMillis() || 0;
            return bTime - aTime; // Most recent first
        });
    } catch (error) {
        console.error('Error getting user rooms:', error);
        throw error;
    }
};

// Delete a room
export const deleteRoom = async (roomId: string) => {
    try {
        const roomRef = doc(db, 'rooms', roomId);
        await deleteDoc(roomRef);
    } catch (error) {
        console.error('Error deleting room:', error);
        throw error;
    }
};
