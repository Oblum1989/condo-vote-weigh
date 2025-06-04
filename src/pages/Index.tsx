import { useState, useEffect } from "react";
import VotingForm from "@/components/VotingForm";
import VotingResults from "@/components/VotingResults";
import AdminPanel from "@/components/AdminPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Vote, BarChart3, Users, Settings } from "lucide-react";
import {
  subscribeToVotes,
  subscribeToVotingState,
  getVoterWeights,
  getQuestions,
  addVote as firebaseAddVote,
  resetVotes as firebaseResetVotes,
  updateVotingState as firebaseUpdateVotingState,
  updateVoterWeights as firebaseUpdateVoterWeights
} from "@/services/firebaseService";
import { useToast } from "@/hooks/use-toast";

export interface VoteData {
  id: string;
  vote: 'si' | 'no' | 'blanco';
  weight: number;
  timestamp: number;
}

export interface VoterWeights {
  [key: string]: number;
}

export interface VotingQuestion {
  id: string;
  title: string;
  description: string;
  options: string[];
  isActive: boolean;
  startTime?: number;
  endTime?: number;
}

export interface VotingState {
  isActive: boolean;
  question: VotingQuestion | null;
  startTime?: number | null;
  endTime?: number | null;
}

const Index = () => {
  const [currentView, setCurrentView] = useState<'voting' | 'results' | 'admin'>('voting');
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [voterWeights, setVoterWeights] = useState<VoterWeights>({});
  const [votingState, setVotingState] = useState<VotingState>({
    isActive: false,
    question: null
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState<string>('Iniciando aplicación...');
  const { toast } = useToast();

  // Cargar datos iniciales y configurar listeners
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Cargar pesos de votantes
        setLoadingStep('Cargando configuración de votantes...');
        const weights = await getVoterWeights();
        setVoterWeights(weights);

        // Configurar listener para votos en tiempo real
        setLoadingStep('Conectando al sistema de votación en tiempo real...');
        const unsubscribeVotes = subscribeToVotes((newVotes) => {
          setVotes(newVotes);
        });

        // Configurar listener para estado de votación en tiempo real
        setLoadingStep('Sincronizando estado de votación...');
        const unsubscribeVotingState = subscribeToVotingState((newState) => {
          setVotingState(newState);
        });

        setLoading(false);

        // Cleanup listeners
        return () => {
          unsubscribeVotes();
          unsubscribeVotingState();
        };
      } catch (error) {
        console.error('Error initializing data:', error);
        toast({
          title: "Error",
          description: "Error al cargar datos. Verifique su conexión.",
          variant: "destructive"
        });
        setLoading(false);
      }
    };

    initializeData();
  }, [toast]);

  const addVote = async (voterId: string, voteOption: 'si' | 'no' | 'blanco') => {
    if (!votingState.isActive) {
      console.error('La votación no está activa');
      return;
    }

    try {
      const weight = voterWeights[voterId] || 1.0;
      const newVote = {
        id: voterId,
        vote: voteOption,
        weight
      };

      await firebaseAddVote(newVote);
      console.log('Nuevo voto registrado:', newVote);
    } catch (error) {
      console.error('Error adding vote:', error);
      toast({
        title: "Error",
        description: "Error al registrar el voto. Intente nuevamente.",
        variant: "destructive"
      });
    }
  };

  const resetVotes = async () => {
    if (confirm('¿Estás seguro de que quieres resetear todos los votos?')) {
      try {
        await firebaseResetVotes();
        // Actualizar el estado local
        setVotes([]);
        // Actualizar el estado de votación
        await firebaseUpdateVotingState({
          isActive: false,
          question: null,
          startTime: null,
          endTime: null
        });
        toast({
          title: "Éxito",
          description: "Todos los votos han sido eliminados y la votación ha sido reiniciada"
        });
      } catch (error) {
        console.error('Error resetting votes:', error);
        toast({
          title: "Error",
          description: "Error al resetear votos",
          variant: "destructive"
        });
      }
    }
  };

  const exportVotes = () => {
    // Crear el encabezado del CSV
    const headers = ['ID', 'Voto', 'Peso', 'Fecha y Hora'];
    const csvContent = [
      headers.join(','),
      ...votes.map(vote => [
        vote.id,
        vote.vote.toUpperCase(),
        vote.weight,
        new Date(vote.timestamp).toLocaleString()
      ].join(','))
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `votos_asamblea_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const updateVotingState = async (newState: Partial<VotingState>) => {
    try {
      await firebaseUpdateVotingState(newState);
    } catch (error) {
      console.error('Error updating voting state:', error);
      toast({
        title: "Error",
        description: "Error al actualizar estado de votación",
        variant: "destructive"
      });
    }
  };

  const updateVoterWeights = async (newWeights: VoterWeights) => {
    try {
      await firebaseUpdateVoterWeights(newWeights);
      setVoterWeights(newWeights);
    } catch (error) {
      console.error('Error updating voter weights:', error);
      toast({
        title: "Error",
        description: "Error al actualizar pesos de votantes",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 mb-2">{loadingStep}</p>
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-1.5 mt-4">
                <div className="bg-blue-600 h-1.5 rounded-full animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Vote className="text-blue-600" size={48} />
            Sistema de Votación Asamblea
          </h1>
          <p className="text-gray-600 text-lg">
            Votación electrónica con pesos diferenciados
          </p>

          {/* Estado de la votación */}
          <div className="mt-4">
            {votingState.isActive ? (
              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Votación ACTIVA
              </div>
            ) : (
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-full">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                Votación INACTIVA
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8 gap-4 flex-wrap">
          <Button
            onClick={() => setCurrentView('voting')}
            variant={currentView === 'voting' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <Users size={20} />
            Votación
          </Button>
          {isAdminAuthenticated && (
            <Button
              onClick={() => setCurrentView('results')}
              variant={currentView === 'results' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <BarChart3 size={20} />
              Resultados
            </Button>
          )}
          <Button
            onClick={() => setCurrentView('admin')}
            variant={currentView === 'admin' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <Settings size={20} />
            Administración
          </Button>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {currentView === 'voting' ? (
            <VotingForm
              onVote={addVote}
              voterWeights={voterWeights}
              existingVotes={votes}
              votingState={votingState}
            />
          ) : currentView === 'results' && isAdminAuthenticated ? (
            <VotingResults
              votes={votes}
              onReset={resetVotes}
              onExport={exportVotes}
              votingState={votingState}
            />
          ) : (
            <AdminPanel
              votingState={votingState}
              onUpdateVotingState={updateVotingState}
              voterWeights={voterWeights}
              onUpdateVoterWeights={updateVoterWeights}
              votes={votes}
              isAuthenticated={isAdminAuthenticated}
              onAuthenticate={setIsAdminAuthenticated}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
