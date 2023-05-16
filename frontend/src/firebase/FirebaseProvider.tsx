import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleAuthProvider, getAuth, signInWithPopup, onAuthStateChanged } from 'firebase/auth';

interface FirebaseContextProps {
    provider: GoogleAuthProvider | null;
    signIn: () => Promise<void> | null;
    isConnected: boolean;
    name: string | null;
    isConnecting: boolean;
    id: string | null;
    signOut: () => void;
}

export const FirebaseContext = createContext<Partial<FirebaseContextProps>>({
    provider: null,
    signIn: () => null,
    isConnected: false,
    name: null,
    isConnecting: false,
    id: null,
    signOut: () => null,
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
    const [provider, setProvider] = useState<GoogleAuthProvider | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [name, setName] = useState<string | null>(null);
    const [id, setId] = useState<string | null>(null);

    useEffect(() => {
        if (!provider) setProvider(new GoogleAuthProvider());
    }, [provider]);

    const signOut = useCallback(() => {
        const auth = getAuth();
        auth.signOut();
        setIsConnected(false);
        setName(null);
        setId(null);
        localStorage.removeItem('streaks-token');
    }, []);

    const signIn = useCallback(async () => {
        console.log('sign');
        if (!provider) throw new Error('Provider not initialized');

        console.log('login');
        setIsConnecting(true);
        const auth = getAuth();

        try {
            const result = await signInWithPopup(auth, provider);
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;
            localStorage.setItem('streaks-token', token || '');
            // The signed-in user info.
            const user = result.user;
            // IdP data available using getAdditionalUserInfo(result)
            // ...
            setName(user.displayName);
            setIsConnected(true);
            setIsConnecting(false);
            setId(user.uid);
        } catch (error: any) {
            setIsConnecting(false);
            throw new Error(error.message);
        }
    }, [provider]);

    // Reauthenticate the user
    useEffect(() => {
        const auth = getAuth();
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                setName(user?.displayName);
                setIsConnected(true);
                setId(user.uid);
            }
        });

        // Need more logic to handle sessions
    }, []);

    const value = useMemo(
        () => ({
            provider,
            signIn,
            isConnected,
            name,
            isConnecting,
            id,
            signOut,
        }),
        [provider, signIn, isConnected, name, isConnecting, id, signOut]
    );

    return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}
