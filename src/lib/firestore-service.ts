
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SavedBio, SavedJob } from '@/lib/schemas';

const USERS_COLLECTION = 'users';

interface UserData {
  savedJobs: SavedJob[];
  savedBios: SavedBio[];
}

/**
 * Retrieves the entire data document for a given user.
 * @param userId - The ID of the user.
 * @returns The user's data or null if not found.
 */
export const getUserData = async (userId: string): Promise<UserData | null> => {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserData;
  }
  return null;
};

/**
 * Merges local data (from localStorage) into the user's Firestore document.
 * This is typically called upon user login.
 * @param userId - The ID of the user.
 * @param localJobs - An array of saved jobs from local storage.
 * @param localBios - An array of saved bios from local storage.
 * @returns The merged user data.
 */
export const mergeLocalDataToFirestore = async (
  userId: string,
  localJobs: SavedJob[],
  localBios: SavedBio[]
): Promise<UserData> => {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    // User exists, merge data. Firestore data is the source of truth.
    const firestoreData = docSnap.data() as UserData;
    const firestoreJobIds = new Set(firestoreData.savedJobs.map((j) => j.id));
    const firestoreBioIds = new Set(firestoreData.savedBios.map((b) => b.id));

    const jobsToMerge = localJobs.filter((j) => !firestoreJobIds.has(j.id));
    const biosToMerge = localBios.filter((b) => !firestoreBioIds.has(b.id));

    const mergedJobs = [...firestoreData.savedJobs, ...jobsToMerge];
    const mergedBios = [...firestoreData.savedBios, ...biosToMerge];
    
    await updateDoc(userDocRef, {
        savedJobs: mergedJobs,
        savedBios: mergedBios
    });

    return { savedJobs: mergedJobs, savedBios: mergedBios };
  } else {
    // New user, just set the local data as their initial data.
    const initialData = { savedJobs: localJobs, savedBios: localBios };
    await setDoc(userDocRef, initialData);
    return initialData;
  }
};

/**
 * Updates the 'savedJobs' array for a user in Firestore.
 * @param userId - The ID of the user.
 * @param savedJobs - The new array of saved jobs.
 */
export const updateSavedJobs = async (userId: string, savedJobs: SavedJob[]): Promise<void> => {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userDocRef, { savedJobs });
};

/**
 * Updates the 'savedBios' array for a user in Firestore.
 * @param userId - The ID of the user.
 * @param savedBios - The new array of saved bios.
 */
export const updateSavedBios = async (userId: string, savedBios: SavedBio[]): Promise<void> => {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userDocRef, { savedBios });
};
