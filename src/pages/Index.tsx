
import { useState, useEffect } from "react";
import VotingForm from "@/components/VotingForm";
import VotingResults from "@/components/VotingResults";
import AdminPanel from "@/components/AdminPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Vote, BarChart3, Users, Settings } from "lucide-react";

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
  startTime?: number;
  endTime?: number;
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

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedVotes = localStorage.getItem('assemblyVotes');
    const savedWeights = localStorage.getItem('voterWeights');
    const savedVotingState = localStorage.getItem('votingState');
    const savedQuestions = localStorage.getItem('votingQuestions');
    
    if (savedVotes) {
      setVotes(JSON.parse(savedVotes));
    }
    
    if (savedWeights) {
      setVoterWeights(JSON.parse(savedWeights));
    } else {
      // Datos de ejemplo - reemplaza con tu base de datos real
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
      setVoterWeights(exampleWeights);
      localStorage.setItem('voterWeights', JSON.stringify(exampleWeights));
    }

    if (savedVotingState) {
      setVotingState(JSON.parse(savedVotingState));
    } else {
      // Pregunta por defecto
      const defaultQuestion: VotingQuestion = {
        id: "1",
        title: "¿Está de acuerdo con la propuesta presentada?",
        description: "Votación sobre la propuesta de mejoras en las áreas comunes del conjunto residencial.",
        options: ["Sí", "No", "En blanco"],
        isActive: false
      };
      
      if (!savedQuestions) {
        localStorage.setItem('votingQuestions', JSON.stringify([defaultQuestion]));
      }
      
      const initialState: VotingState = {
        isActive: false,
        question: defaultQuestion
      };
      setVotingState(initialState);
      localStorage.setItem('votingState', JSON.stringify(initialState));
    }
  }, []);

  // Guardar votos y estado en localStorage cada vez que cambien
  useEffect(() => {
    localStorage.setItem('assemblyVotes', JSON.stringify(votes));
  }, [votes]);

  useEffect(() => {
    localStorage.setItem('votingState', JSON.stringify(votingState));
  }, [votingState]);

  const addVote = (voterId: string, voteOption: 'si' | 'no' | 'blanco') => {
    if (!votingState.isActive) {
      console.error('La votación no está activa');
      return;
    }

    const weight = voterWeights[voterId] || 1.0;
    const newVote: VoteData = {
      id: voterId,
      vote: voteOption,
      weight,
      timestamp: Date.now()
    };
    
    setVotes(prev => [...prev, newVote]);
    console.log('Nuevo voto registrado:', newVote);
  };

  const resetVotes = () => {
    if (confirm('¿Estás seguro de que quieres resetear todos los votos?')) {
      setVotes([]);
      localStorage.removeItem('assemblyVotes');
    }
  };

  const exportVotes = () => {
    const dataStr = JSON.stringify(votes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `votos_asamblea_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const updateVotingState = (newState: Partial<VotingState>) => {
    setVotingState(prev => ({ ...prev, ...newState }));
  };

  const updateVoterWeights = (newWeights: VoterWeights) => {
    setVoterWeights(newWeights);
    localStorage.setItem('voterWeights', JSON.stringify(newWeights));
  };

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
          <Button
            onClick={() => setCurrentView('results')}
            variant={currentView === 'results' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <BarChart3 size={20} />
            Resultados
          </Button>
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
          ) : currentView === 'results' ? (
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

        {/* Footer Stats */}
        <Card className="mt-8 max-w-md mx-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-center">Estado Actual</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-blue-600">{votes.length}</div>
            <div className="text-gray-600">Votos registrados</div>
            {votingState.question && (
              <div className="mt-2 text-sm text-gray-500">
                {votingState.question.title}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
