import { useContext } from 'react';
import { FirebaseContext } from './FirebaseProvider';

export function useFirebase() {
    return useContext(FirebaseContext);
}
