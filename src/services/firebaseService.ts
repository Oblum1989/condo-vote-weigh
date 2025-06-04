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
  Timestamp,
  orderBy,
  limit,
  setDoc
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

// Función para obtener todos los votos (sin tiempo real, para reportes)
export const getAllVotes = async (): Promise<VoteData[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTIONS.VOTES), orderBy('timestamp', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.data().id,
      vote: doc.data().vote,
      weight: doc.data().weight,
      timestamp: doc.data().timestamp
    }));
  } catch (error) {
    console.error('Error getting all votes:', error);
    return [];
  }
};

// Suscripción en tiempo real solo para los votos más recientes
export const subscribeToVotes = (callback: (votes: VoteData[]) => void) => {
  const votesRef = collection(db, COLLECTIONS.VOTES);
  const recentVotesLimit = 50; // Mantener límite para actualizaciones en tiempo real

  return onSnapshot(
    query(votesRef, orderBy('timestamp', 'desc'), limit(recentVotesLimit)),
    (snapshot) => {
      const votes: VoteData[] = [];
      snapshot.forEach((doc) => {
        votes.push({ id: doc.id, ...doc.data() } as VoteData);
      });
      callback(votes);
    },
    (error) => {
      console.error('Error subscribing to votes:', error);
      callback([]);
    }
  );
};

// Función para obtener votos paginados
export const getVotesByPage = async (pageSize: number, lastTimestamp?: number): Promise<{ votes: VoteData[], hasMore: boolean }> => {
  try {
    let q = query(
      collection(db, COLLECTIONS.VOTES),
      orderBy('timestamp', 'desc'),
      limit(pageSize + 1) // Pedimos uno más para saber si hay más páginas
    );

    if (lastTimestamp) {
      q = query(
        collection(db, COLLECTIONS.VOTES),
        orderBy('timestamp', 'desc'),
        limit(pageSize + 1),
        where('timestamp', '<', lastTimestamp)
      );
    }

    const querySnapshot = await getDocs(q);
    const votes = querySnapshot.docs.slice(0, pageSize).map(doc => ({
      id: doc.data().id,
      vote: doc.data().vote,
      weight: doc.data().weight,
      timestamp: doc.data().timestamp
    }));

    const hasMore = querySnapshot.docs.length > pageSize;

    return {
      votes,
      hasMore
    };
  } catch (error) {
    console.error('Error getting votes by page:', error);
    return {
      votes: [],
      hasMore: false
    };
  }
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
export const getVoterWeights = async () => {
  try {
    const docRef = doc(db, COLLECTIONS.VOTER_WEIGHTS, 'current');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as VoterWeights;
    }
    return {};
  } catch (error) {
    console.error('Error fetching voter weights:', error);
    return {};
  }
};

export const updateVoterWeights = async (weights: VoterWeights) => {
  try {
    const docRef = doc(db, COLLECTIONS.VOTER_WEIGHTS, 'current');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Si el documento no existe, lo creamos
      await setDoc(docRef, weights);
    } else {
      // Si existe, lo actualizamos
      await updateDoc(docRef, weights);
    }
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
      await setDoc(docRef, defaultState);
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
    const docSnap = await getDoc(docRef);

    // Limpiamos el estado eliminando campos undefined
    const cleanState = Object.entries(state).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Partial<VotingState>);

    if (!docSnap.exists()) {
      // Si el documento no existe, lo creamos con el estado inicial
      await setDoc(docRef, {
        isActive: false,
        question: null,
        ...cleanState
      });
    } else {
      // Si existe, actualizamos solo los campos proporcionados
      await updateDoc(docRef, cleanState);
    }
  } catch (error) {
    console.error('Error updating voting state:', error);
    throw error;
  }
};

export const subscribeToVotingState = (callback: (state: VotingState) => void) => {
  const stateRef = doc(db, COLLECTIONS.VOTING_STATE, 'current');

  return onSnapshot(
    stateRef,
    (snapshot) => {
      const state = snapshot.data() as VotingState || {
        isActive: false,
        question: null
      };
      callback(state);
    },
    (error) => {
      console.error('Error subscribing to voting state:', error);
      callback({ isActive: false, question: null });
    }
  );
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
