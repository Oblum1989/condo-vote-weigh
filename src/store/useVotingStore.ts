import { create } from 'zustand'
import type { VoteData, VoterWeights, VotingState, AttendanceData } from '@/types'
import {
  addVote as firebaseAddVote,
  resetVotes as firebaseResetVotes,
  updateVotingState as firebaseUpdateVotingState,
  updateVoterWeights as firebaseUpdateVoterWeights,
  validateVoter,
  updateAttendanceStatus
} from '@/services/firebaseService'

interface VotingStore {
  // State
  loading: boolean
  loadingStep: string
  votes: VoteData[]
  voterWeights: VoterWeights
  attendance: Array<{
    cedula: string
    apartment: string
    enabled: boolean
    timestamp: number
  }>
  votingState: VotingState
  currentView: 'voting' | 'results' | 'admin_votacion' | 'attendance'

  // Actions
  setLoading: (loading: boolean) => void
  setLoadingStep: (step: string) => void
  setVotes: (votes: VoteData[]) => void
  setVoterWeights: (weights: VoterWeights) => void
  setAttendance: (attendance: Array<{
    cedula: string
    apartment: string
    enabled: boolean
    timestamp: number
  }>) => void
  setVotingState: (state: VotingState) => void
  setCurrentView: (view: 'voting' | 'results' | 'admin_votacion' | 'attendance') => void

  // Thunks
  addVote: (voterId: string, apartment: string, voteOption: string) => Promise<void>
  resetVotes: () => Promise<void>
  updateVotingState: (newState: Partial<VotingState>) => Promise<void>
  updateVoterWeights: (newWeights: VoterWeights) => Promise<void>
  toggleAttendance: (record: { cedula: string; enabled: boolean }) => Promise<void>
}

export const useVotingStore = create<VotingStore>((set, get) => ({
  // Initial state
  loading: true,
  loadingStep: '',
  votes: [],
  voterWeights: {},
  attendance: [],
  votingState: {
    isActive: false,
    question: null,
    showResults: false
  },
  currentView: 'voting',

  // Basic actions
  setLoading: (loading) => set({ loading }),
  setLoadingStep: (loadingStep) => set({ loadingStep }),
  setVotes: (votes) => set({ votes }),
  setVoterWeights: (voterWeights) => set({ voterWeights }),
  setAttendance: (attendance) => set({ attendance }),
  setVotingState: (votingState) => set({ votingState }),
  setCurrentView: (currentView) => set({ currentView }),

  // Thunks
  addVote: async (voterId, apartment, voteOption) => {
    const { votingState, voterWeights } = get()

    if (!votingState.isActive) {
      throw new Error('La votación no está activa')
    }

    const validation = await validateVoter(voterId, apartment)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const weight = voterWeights[apartment] || 1.0
    const newVote = {
      id: voterId,
      apartment,
      vote: voteOption,
      weight
    }

    await firebaseAddVote(newVote)
  },

  resetVotes: async () => {
    await firebaseResetVotes()
    set({ votes: [] })
    await firebaseUpdateVotingState({
      isActive: false,
      question: null,
      startTime: null,
      endTime: null
    })
  },

  updateVotingState: async (newState) => {
    await firebaseUpdateVotingState(newState)
  },

  updateVoterWeights: async (newWeights) => {
    await firebaseUpdateVoterWeights(newWeights)
    set({ voterWeights: newWeights })
  },

  toggleAttendance: async (record) => {
    await updateAttendanceStatus(record.cedula, !record.enabled)
  }
}))
