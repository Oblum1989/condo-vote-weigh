import { useState, useEffect, useCallback } from "react";
import VotingForm from "@/components/VotingForm";
import VotingResults from "@/components/VotingResults";
import AdminPanel from "@/components/AdminPanel";
import LoginForm from "@/components/LoginForm";
import AttendancePanel from "@/components/AttendancePanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Vote, BarChart3, Users, Settings, LogOut } from "lucide-react";
import {
  subscribeToVotes,
  subscribeToVotingState,
  getVoterWeights,
  addVote as firebaseAddVote,
  resetVotes as firebaseResetVotes,
  updateVotingState as firebaseUpdateVotingState,
  updateVoterWeights as firebaseUpdateVoterWeights,
  validateVoter,
  getAllAttendance,
  updateAttendanceStatus
} from "@/services/firebaseService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  VoteData,
  VoterWeights,
  Voter,
  Voters,
  VotingState,
  AttendanceData
} from "@/types";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState("");
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [voters, setVoters] = useState<Voters>({});
  const [voterWeights, setVoterWeights] = useState<VoterWeights>({});
  const [attendance, setAttendance] = useState<Array<{
    cedula: string;
    apartment: string;
    enabled: boolean;
    timestamp: number;
  }>>([]);
  const [votingState, setVotingState] = useState<VotingState>({
    isActive: false,
    question: null,
    showResults: false
  });
  const [currentView, setCurrentView] = useState<'voting' | 'results' | 'admin_votacion' | 'attendance'>('voting');
  const { toast } = useToast();
  const { user, hasRole, logout } = useAuth();

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

  const addVote = async (voterId: string, apartment: string, voteOption: string) => {
    if (!votingState.isActive) {
      console.error('La votación no está activa');
      return;
    }

    try {
      // Validar el votante
      const validation = await validateVoter(voterId, apartment);
      if (!validation.valid) {
        toast({
          title: "Error de validación",
          description: validation.error,
          variant: "destructive"
        });
        return;
      }

      const weight = voterWeights[apartment] || 1.0;
      const newVote = {
        id: voterId,
        apartment,
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

  const loadAttendance = useCallback(async () => {
    try {
      const attendanceList = await getAllAttendance();
      setAttendance(attendanceList);
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast({
        title: "Error",
        description: "Error al cargar la lista de asistencia",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    if (currentView === 'attendance') {
      loadAttendance();
    }
  }, [currentView, loadAttendance]);

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
      <div className="container mx-auto py-8 px-4">
        {/* Status Banner */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-4 bg-white p-4 rounded-lg shadow text-lg">
            {votingState.isActive ? (
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Votación ACTIVA: {votingState.question?.title}
              </div>
            ) : (
              <div className="flex items-center text-gray-600">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                Votación INACTIVA
              </div>
            )}
          </div>
        </div>

        {/* User info and logout */}
        {user && (
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow">
              <span className="text-sm text-gray-600">
                Sesión: Admin Votación
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut size={16} />
                Salir
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center mb-8 gap-4 flex-wrap">
          <Button
            onClick={() => setCurrentView('voting')}
            variant={currentView === 'voting' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <Vote size={20} />
            Votación
          </Button>

          <Button
            onClick={() => setCurrentView('results')}
            variant={currentView === 'results' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <BarChart3 size={20} />
            Resultados
          </Button>

          {!user ? (
            <Button
              onClick={() => setCurrentView('admin_votacion')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings size={20} />
              Iniciar Sesión Admin
            </Button>
          ) : hasRole('admin_votacion') && (
            <>
              <Button
                onClick={() => setCurrentView('admin_votacion')}
                variant={currentView === 'admin_votacion' ? 'default' : 'outline'}
                className="flex items-center gap-2"
              >
                <Settings size={20} />
                Panel Admin
              </Button>
              <Button
                onClick={() => setCurrentView('attendance')}
                variant={currentView === 'attendance' ? 'default' : 'outline'}
                className="flex items-center gap-2"
              >
                <Users size={20} />
                Panel de Asistencia
              </Button>
            </>
          )}
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
          ) : currentView === 'results' ? (
            <VotingResults
              votes={votes}
              onReset={hasRole('admin_votacion') ? resetVotes : undefined}
              onExport={hasRole('admin_votacion') ? exportVotes : undefined}
              votingState={votingState}
              isAdmin={hasRole('admin_votacion')}
            />
          ) : currentView === 'admin_votacion' && !hasRole('admin_votacion') ? (
            <LoginForm
              role="admin_votacion"
              title="Administrador de Votación"
              onSuccess={() => {
                // El usuario ya está autenticado, se re-renderizará
              }}
            />
          ) : currentView === 'admin_votacion' && hasRole('admin_votacion') ? (
            <AdminPanel
              votingState={votingState}
              onUpdateVotingState={updateVotingState}
              voterWeights={voterWeights}
              onUpdateVoterWeights={updateVoterWeights}
              votes={votes}
              isAuthenticated={true}
              onAuthenticate={() => { }} // No longer needed with AuthContext
            />
          ) : currentView === 'attendance' && hasRole('admin_votacion') ? (
            <AttendancePanel
              attendance={attendance}
              voterWeights={voterWeights}
              voters={voters}
              onUpdateVoterWeights={updateVoterWeights}
              onAttendanceUpdate={loadAttendance}
              onToggleAttendance={async (record) => {
                try {
                  await updateAttendanceStatus(record.cedula, !record.enabled);
                  await loadAttendance(); // Recargar la lista después de actualizar
                } catch (error) {
                  console.error('Error updating attendance:', error);
                  toast({
                    title: "Error",
                    description: "Error al actualizar el estado de asistencia",
                    variant: "destructive"
                  });
                }
              }}
            />
          ) : (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
              <p className="text-gray-600">No tienes permisos para ver esta sección</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
