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
import { VoteData, VoterWeights, VotingState, VotingQuestion, VoterData, AttendanceData } from '@/types';

// Colecciones
export const COLLECTIONS = {
  VOTES: 'votes',
  VOTER_WEIGHTS: 'voterWeights',
  VOTING_STATE: 'votingState',
  QUESTIONS: 'questions',
  VOTERS: 'voters',
  ATTENDANCE: 'attendance'
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
      timestamp: doc.data().timestamp,
      apartment: doc.data().apartment
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
      id: doc.id,
      vote: doc.data().vote,
      weight: doc.data().weight,
      timestamp: doc.data().timestamp,
      apartment: doc.data().apartment
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
      id: doc.id,
      vote: doc.data().vote,
      weight: doc.data().weight,
      timestamp: doc.data().timestamp,
      apartment: doc.data().apartment
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

// Get all voters
export const getAllVoters = async (): Promise<VoterData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.VOTERS));
    return querySnapshot.docs.map(doc => ({
      cedula: doc.data().cedula,
      apartment: doc.data().apartment,
      attendanceApartment: doc.data().attendanceApartment
    }));
  } catch (error) {
    console.error('Error getting voters:', error);
    return [];
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
        question: null,
        showResults: false
      };
      await setDoc(docRef, defaultState);
      return defaultState;
    }
  } catch (error) {
    console.error('Error getting voting state:', error);
    return { isActive: false, question: null, showResults: false };
  }
};

// Extender el estado de votación para incluir visibilidad de resultados
export interface ExtendedVotingState extends VotingState {
  showResults: boolean;
}

// Modificar la función de actualización del estado para incluir visibilidad
export const updateVotingState = async (state: Partial<ExtendedVotingState>) => {
  try {
    const docRef = doc(db, COLLECTIONS.VOTING_STATE, 'current');
    const docSnap = await getDoc(docRef);

    // Limpiamos el estado eliminando campos undefined
    const cleanState = Object.entries(state).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Partial<ExtendedVotingState>);

    if (!docSnap.exists()) {
      // Si el documento no existe, lo creamos con el estado inicial
      await setDoc(docRef, {
        isActive: false,
        question: null,
        showResults: false,
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
        question: null,
        showResults: false
      };
      callback(state);
    },
    (error) => {
      console.error('Error subscribing to voting state:', error);
      callback({ isActive: false, question: null, showResults: false });
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

// Funciones para gestión de votantes
export const addVoter = async (voterData: VoterData) => {
  try {
    await setDoc(doc(db, COLLECTIONS.VOTERS, voterData.cedula), voterData);
  } catch (error) {
    console.error('Error adding voter:', error);
    throw error;
  }
};

export const getVoter = async (cedula: string): Promise<VoterData | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.VOTERS, cedula);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as VoterData : null;
  } catch (error) {
    console.error('Error getting voter:', error);
    return null;
  }
};

export const validateVoter = async (cedula: string, apartment: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    const voterData = await getVoter(cedula);

    if (!voterData) {
      return { valid: false, error: 'Cédula no registrada en el sistema' };
    }

    // Verificar si el apartamento coincide con el registrado
    if (voterData.apartment !== apartment) {
      return { valid: false, error: 'El apartamento no coincide con el registrado para esta cédula' };
    }

    // Si hay un apartamento registrado en asistencia, verificar que coincida
    if (voterData.attendanceApartment && voterData.attendanceApartment !== apartment) {
      return {
        valid: false,
        error: 'Debe votar con el apartamento registrado en la asistencia'
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating voter:', error);
    return { valid: false, error: 'Error al validar votante' };
  }
};

// Asistencia
export interface AttendanceData {
  cedula: string;
  apartment: string;
  timestamp: number;
  enabled: boolean;
}

export const registerAttendance = async (data: Omit<AttendanceData, 'timestamp'>) => {
  try {
    const attendanceData = {
      ...data,
      timestamp: Timestamp.now().toMillis(),
      enabled: true
    };
    await setDoc(doc(db, COLLECTIONS.ATTENDANCE, data.cedula), attendanceData);
  } catch (error) {
    console.error('Error registering attendance:', error);
    throw error;
  }
};

export const checkAttendance = async (cedula: string): Promise<AttendanceData | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.ATTENDANCE, cedula);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AttendanceData;
    }
    return null;
  } catch (error) {
    console.error('Error checking attendance:', error);
    throw error;
  }
};

export const getAllAttendance = async (): Promise<AttendanceData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.ATTENDANCE));
    return querySnapshot.docs.map(doc => doc.data() as AttendanceData);
  } catch (error) {
    console.error('Error getting attendance:', error);
    throw error;
  }
};

export const updateAttendanceStatus = async (cedula: string, enabled: boolean) => {
  try {
    const docRef = doc(db, COLLECTIONS.ATTENDANCE, cedula);
    await updateDoc(docRef, { enabled });
  } catch (error) {
    console.error('Error updating attendance status:', error);
    throw error;
  }
};
