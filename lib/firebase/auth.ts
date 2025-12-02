import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    signInAnonymously,
    updateProfile,
    onAuthStateChanged,
    User,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
    }
};

// Sign out
export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

// Sign in as guest (anonymous)
export const signInAsGuest = async (displayName: string) => {
    try {
        const result = await signInAnonymously(auth);
        // Update the display name for the anonymous user
        if (result.user) {
            await updateProfile(result.user, { displayName });
        }
        return result.user;
    } catch (error) {
        console.error('Error signing in as guest:', error);
        throw error;
    }
};

// Auth state observer
export const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// Delete user account
export const deleteUserAccount = async (user: User) => {
    try {
        await user.delete();
    } catch (error) {
        console.error('Error deleting user account:', error);
        throw error;
    }
};
