
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  onSnapshot, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { VoteData, VoterWeights, VotingState, VotingQuestion } from '@/pages/Index';

// Colecciones
export const COLLECTIONS = {
  VOTES: 'votes',
  VOTER_WEIGHTS: 'voterWeights',
  VOTING_STATE: 'votingState',
  QUESTIONS: 'questions'
};

// Votos
export const addVote = async (vote: Omit<VoteData, 'timestamp'>) => {
  try {
    const voteData = {
      ...vote,
      timestamp: Timestamp.now().toMillis()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.VOTES), voteData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding vote:', error);
    throw error;
  }
};

export const getVotes = async (): Promise<VoteData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.VOTES));
    return querySnapshot.docs.map(doc => ({
      id: doc.data().id,
      vote: doc.data().vote,
      weight: doc.data().weight,
      timestamp: doc.data().timestamp
    }));
  } catch (error) {
    console.error('Error getting votes:', error);
    return [];
  }
};

export const subscribeToVotes = (callback: (votes: VoteData[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.VOTES), (snapshot) => {
    const votes = snapshot.docs.map(doc => ({
      id: doc.data().id,
      vote: doc.data().vote,
      weight: doc.data().weight,
      timestamp: doc.data().timestamp
    }));
    callback(votes);
  });
};

export const checkIfVoted = async (voterId: string): Promise<boolean> => {
  try {
    const q = query(collection(db, COLLECTIONS.VOTES), where('id', '==', voterId));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking vote:', error);
    return false;
  }
};

export const resetVotes = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.VOTES));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error resetting votes:', error);
    throw error;
  }
};

// Pesos de votantes
export const getVoterWeights = async (): Promise<VoterWeights> => {
  try {
    const docRef = doc(db, COLLECTIONS.VOTER_WEIGHTS, 'weights');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as VoterWeights;
    } else {
      // Datos de ejemplo si no existen
      const exampleWeights: VoterWeights = {
        "001": 1.5,
        "002": 1.0,
        "003": 2.0,
        "004": 1.0,
        "005": 1.5,
        "101": 1.2,
        "102": 1.8,
        "201": 1.3,
        "202": 1.7,
        "301": 1.1,
      };
      await updateDoc(docRef, exampleWeights);
      return exampleWeights;
    }
  } catch (error) {
    console.error('Error getting voter weights:', error);
    return {};
  }
};

export const updateVoterWeights = async (weights: VoterWeights) => {
  try {
    const docRef = doc(db, COLLECTIONS.VOTER_WEIGHTS, 'weights');
    await updateDoc(docRef, weights);
  } catch (error) {
    console.error('Error updating voter weights:', error);
    throw error;
  }
};

// Estado de votación
export const getVotingState = async (): Promise<VotingState> => {
  try {
    const docRef = doc(db, COLLECTIONS.VOTING_STATE, 'current');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as VotingState;
    } else {
      const defaultState: VotingState = {
        isActive: false,
        question: null
      };
      await updateDoc(docRef, defaultState);
      return defaultState;
    }
  } catch (error) {
    console.error('Error getting voting state:', error);
    return { isActive: false, question: null };
  }
};

export const updateVotingState = async (state: Partial<VotingState>) => {
  try {
    const docRef = doc(db, COLLECTIONS.VOTING_STATE, 'current');
    await updateDoc(docRef, state);
  } catch (error) {
    console.error('Error updating voting state:', error);
    throw error;
  }
};

export const subscribeToVotingState = (callback: (state: VotingState) => void) => {
  const docRef = doc(db, COLLECTIONS.VOTING_STATE, 'current');
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as VotingState);
    }
  });
};

// Preguntas
export const getQuestions = async (): Promise<VotingQuestion[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.QUESTIONS));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VotingQuestion));
  } catch (error) {
    console.error('Error getting questions:', error);
    return [];
  }
};

export const addQuestion = async (question: Omit<VotingQuestion, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.QUESTIONS), question);
    return docRef.id;
  } catch (error) {
    console.error('Error adding question:', error);
    throw error;
  }
};

export const deleteQuestion = async (questionId: string) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.QUESTIONS, questionId));
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};
