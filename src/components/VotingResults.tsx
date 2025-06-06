import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Circle, Download, TrendingUp, Clock, RotateCcw, Lock } from "lucide-react";
import { VoteData, VotingState } from "@/pages/Index";
import { getAllVotes } from "@/services/firebaseService";
import { useToast } from "@/hooks/use-toast";

interface VotingResultsProps {
  votes: VoteData[];
  onReset: () => void;
  onExport: () => void;
  votingState: VotingState;
  isAdmin?: boolean;
}

const VotingResults = ({
  votes: realtimeVotes,
  onReset,
  onExport,
  votingState,
  isAdmin = false
}: VotingResultsProps) => {
  const { toast } = useToast();
  const [allVotes, setAllVotes] = useState<VoteData[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar todos los votos
  useEffect(() => {
    loadAllVotes();
  }, []);

  const loadAllVotes = async () => {
    setLoading(true);
    try {
      const votes = await getAllVotes();
      setAllVotes(votes);
    } catch (error) {
      console.error('Error loading votes:', error);
    }
    setLoading(false);
  };

  // Calcular totales usando todos los votos disponibles
  const calculateTotals = (votesToCount: VoteData[]) => {
    return votesToCount.reduce(
      (acc, vote) => {
        const weight = vote.weight || 1;
        if (vote.vote === 'si') acc.yes += weight;
        else if (vote.vote === 'no') acc.no += weight;
        else acc.blank += weight;
        acc.total += weight;
        return acc;
      },
      { yes: 0, no: 0, blank: 0, total: 0 }
    );
  };

  const allVotesTotals = calculateTotals(allVotes);

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return (value / total) * 100;
  };

  const getVoteIcon = (type: string) => {
    switch (type) {
      case 'si': return <CheckCircle className="text-green-600" size={24} />;
      case 'no': return <XCircle className="text-red-600" size={24} />;
      case 'blanco': return <Circle className="text-gray-600" size={24} />;
      default: return null;
    }
  };

  const getVoteLabel = (type: string) => {
    switch (type) {
      case 'si': return 'SÍ';
      case 'no': return 'NO';
      case 'blanco': return 'EN BLANCO';
      default: return '';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3">Cargando resultados...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin && !votingState.showResults) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Lock className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2">Resultados no disponibles</h3>
            <p className="text-gray-600">
              Los resultados serán visibles cuando el administrador lo habilite.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular resultados
  const totalVotes = realtimeVotes.length;
  const totalWeight = realtimeVotes.reduce((sum, vote) => sum + vote.weight, 0);

  const results = realtimeVotes.reduce((acc, vote) => {
    acc[vote.vote] = {
      count: (acc[vote.vote]?.count || 0) + 1,
      weight: (acc[vote.vote]?.weight || 0) + vote.weight
    };
    return acc;
  }, {} as Record<string, { count: number; weight: number }>);

  // Calcular porcentajes
  const calculatePercentage = (weight: number) => {
    return totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Current Question */}
      {votingState.question && (
        <Card>
          <CardContent className="pt-6">
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h2 className="text-xl font-semibold">{votingState.question.title}</h2>
              {votingState.question.description && (
                <p className="text-gray-600">{votingState.question.description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados de la Votación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalVotes}</div>
              <div className="text-sm text-gray-600">Votos Totales</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalWeight.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Peso Total</div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4">
            {Object.entries(results).map(([option, data]) => (
              <div key={option} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({data.count} votos, peso {data.weight.toFixed(1)})
                    </span>
                  </div>
                  <span className="text-sm font-semibold">
                    {calculatePercentage(data.weight).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${calculatePercentage(data.weight)}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button
                variant="destructive"
                className="w-full flex items-center justify-center gap-2 h-12"
                onClick={() => {
                  if (confirm('¿Está seguro de que desea resetear los votos?')) {
                    onReset();
                  }
                }}
              >
                <RotateCcw size={20} />
                Resetear Votos
              </Button>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 h-12"
                onClick={onExport}
              >
                <Download size={20} />
                Exportar Resultados
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VotingResults;
