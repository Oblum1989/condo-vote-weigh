
import { useState, useEffect } from "react";
import VotingForm from "@/components/VotingForm";
import VotingResults from "@/components/VotingResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Vote, BarChart3, Users } from "lucide-react";

export interface VoteData {
  id: string;
  vote: 'si' | 'no' | 'blanco';
  weight: number;
  timestamp: number;
}

export interface VoterWeights {
  [key: string]: number;
}

const Index = () => {
  const [currentView, setCurrentView] = useState<'voting' | 'results'>('voting');
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [voterWeights, setVoterWeights] = useState<VoterWeights>({});

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedVotes = localStorage.getItem('assemblyVotes');
    const savedWeights = localStorage.getItem('voterWeights');
    
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
      };
      setVoterWeights(exampleWeights);
      localStorage.setItem('voterWeights', JSON.stringify(exampleWeights));
    }
  }, []);

  // Guardar votos en localStorage cada vez que cambien
  useEffect(() => {
    localStorage.setItem('assemblyVotes', JSON.stringify(votes));
  }, [votes]);

  const addVote = (voterId: string, voteOption: 'si' | 'no' | 'blanco') => {
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
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8 gap-4">
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
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {currentView === 'voting' ? (
            <VotingForm 
              onVote={addVote} 
              voterWeights={voterWeights}
              existingVotes={votes}
            />
          ) : (
            <VotingResults 
              votes={votes} 
              onReset={resetVotes}
              onExport={exportVotes}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
