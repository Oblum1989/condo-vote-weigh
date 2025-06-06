import { useEffect, useCallback } from "react";
import VotingForm from "@/components/VotingForm";
import VotingResults from "@/components/VotingResults";
import AdminPanel from "@/components/adminPanel/AdminPanel";
import LoginForm from "@/components/LoginForm";
import AttendancePanel from "@/components/attendancePanel/AttendancePanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Vote, BarChart3, Users, Settings, LogOut } from "lucide-react";
import {
  subscribeToVotes,
  subscribeToVotingState,
  getVoterWeights,
  getAllAttendance,
} from "@/services/firebaseService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useVotingStore } from "@/store/useVotingStore";

const Index = () => {
  const { toast } = useToast();
  const { user, hasRole, logout } = useAuth();

  const {
    loading,
    loadingStep,
    votingState,
    currentView,
    setLoading,
    setLoadingStep,
    setVotes,
    setVoterWeights,
    setAttendance,
    setVotingState,
    setCurrentView  } = useVotingStore();


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
  }, [toast, setLoading, setLoadingStep, setVotes, setVoterWeights, setVotingState]);

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
  }, [toast, setAttendance]);

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

  // Mostrar formulario de login si se requiere autenticación para la vista actual
  if ((currentView === 'admin_votacion' && !hasRole('admin_votacion')) ||
      (currentView === 'admin_asistencias' && !hasRole('admin_asistencias'))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="space-y-4">
          <LoginForm
            role={currentView === 'admin_votacion' ? 'admin_votacion' : 'admin_asistencias'}
            title={currentView === 'admin_votacion' ? 'Administrador de Votación' : 'Administrador de Asistencias'}
            onSuccess={() => {
              // El usuario ya está autenticado, el componente se re-renderizará
            }}
          />
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setCurrentView('voting')}
            >
              Volver a Votación
            </Button>
          </div>
        </div>
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
            <VotingForm />
          ) : currentView === 'results' ? (
            <VotingResults isAdmin={hasRole('admin_votacion')} />
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
              isAuthenticated={true}
              onAuthenticate={() => { }} // No longer needed with AuthContext
            />
          ) : currentView === 'attendance' && hasRole('admin_votacion') ? (
            <AttendancePanel />

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
