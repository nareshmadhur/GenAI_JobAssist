import { db } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { JobApplicationData, SavedJob, SavedRepository } from './schemas';

// User data operations
export const getUserData = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data();
  } else {
    // Initialize default user data if not exists
    const defaultData = {
      savedJobs: [],
      savedRepositories: [],
    };
    await setDoc(userRef, defaultData);
    return defaultData;
  }
};

// Merge local storage data into Firestore
export const mergeLocalDataToFirestore = async (
  userId: string,
  localJobs: SavedJob[],
  localRepositories: SavedRepository[]
) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  let firestoreJobs: SavedJob[] = [];
  let firestoreRepositories: SavedRepository[] = [];

  if (userSnap.exists()) {
    const data = userSnap.data();
    firestoreJobs = data.savedJobs || [];
    firestoreRepositories = data.savedRepositories || [];
  }

  // Merge logic: Combine and remove duplicates by ID
  const mergedJobs = [...localJobs, ...firestoreJobs].filter(
    (job, index, self) => index === self.findIndex((j) => j.id === job.id)
  );

  const mergedRepositories = [...localRepositories, ...firestoreRepositories].filter(
    (repo, index, self) => index === self.findIndex((r) => r.id === repo.id)
  );

  await setDoc(userRef, {
    savedJobs: mergedJobs,
    savedRepositories: mergedRepositories,
  }, { merge: true });

  return { savedJobs: mergedJobs, savedRepositories: mergedRepositories };
};

// Update saved jobs list
export const updateSavedJobs = async (userId: string, jobs: SavedJob[]) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { savedJobs: jobs });
};

// Update saved repositories list
export const updateSavedRepositories = async (userId: string, repos: SavedRepository[]) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { savedRepositories: repos });
};

// Detailed Job operations (Individual documents if needed in future)
// For now we store as array in user doc for simplicity and speed, 
// but we can move to subcollections if the arrays get too large (>1MB).

// Saved Repository operations
export const saveRepository = async (userId: string, name: string, workRepository: string) => {
  // We can choose to store this in an array in the user doc or a subcollection.
  // Given users might have many repositories, let's stick to the current pattern 
  // until we need subcollections.
  const userRef = doc(db, 'users', userId);
  const userData = await getUserData(userId);
  const currentRepos = userData.savedRepositories || [];
  
  const newRepo: SavedRepository = {
    id: crypto.randomUUID(),
    name,
    workRepository,
    savedAt: new Date().toISOString()
  };

  await updateDoc(userRef, {
    savedRepositories: [newRepo, ...currentRepos]
  });

  return newRepo;
};

export const getSavedRepositories = async (userId: string): Promise<SavedRepository[]> => {
  const userData = await getUserData(userId);
  return userData.savedRepositories || [];
};

export const deleteSavedRepository = async (userId: string, repoId: string) => {
  const userRef = doc(db, 'users', userId);
  const userData = await getUserData(userId);
  const filteredRepos = (userData.savedRepositories || []).filter((r: SavedRepository) => r.id !== repoId);
  await updateDoc(userRef, { savedRepositories: filteredRepos });
};
