import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Circle, Download, TrendingUp, Clock, RotateCcw } from "lucide-react";
import { VoteData, VotingState } from "@/pages/Index";
import { getAllVotes } from "@/services/firebaseService";

interface VotingResultsProps {
  votes: VoteData[]; // Votos en tiempo real
  onReset: () => void;
  onExport: () => void;
  votingState: VotingState;
}

const VotingResults = ({ votes: realtimeVotes, onReset, onExport, votingState }: VotingResultsProps) => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Panel de Resultados</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Total de votos registrados: {allVotesTotals.total.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {allVotes.length}
            </div>
            <div className="text-sm text-muted-foreground">Total de Votos</div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {(['si', 'no', 'blanco'] as const).map((voteType) => {
              const voteCount = allVotesTotals[voteType === 'si' ? 'yes' : voteType === 'no' ? 'no' : 'blank'];
              const percentage = getPercentage(voteCount, allVotesTotals.total);

              return (
                <div key={voteType} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getVoteIcon(voteType)}
                    <span className="font-medium">{getVoteLabel(voteType)}</span>
                  </div>

                  <Progress value={percentage} className="h-2" />

                  <div className="flex justify-between items-start">
                    <div className="text-2xl font-bold">
                      {percentage ? percentage.toFixed(1) : '0'}%
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Votos: {voteCount ? voteCount.toFixed(2) : '0'}</div>
                      <div>Peso total: {voteCount ? voteCount.toFixed(2) : '0'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <TrendingUp className="text-blue-600" size={24} />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {allVotesTotals.total.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Votos</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Clock className="text-blue-600" size={24} />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {votingState.startTime ? formatTime(votingState.startTime) : 'No iniciada'}
                </div>
                <div className="text-sm text-gray-600">Hora Inicio</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Clock className="text-blue-600" size={24} />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {votingState.endTime ? formatTime(votingState.endTime) : 'En curso'}
                </div>
                <div className="text-sm text-gray-600">Hora Fin</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button
                onClick={onReset}
                variant="destructive"
                className="flex items-center gap-2"
                disabled={allVotes.length === 0}
              >
                <RotateCcw size={20} />
                Resetear Votación
              </Button>
              <Button onClick={onExport}>
                <Download size={20} className="mr-2" />
                Descargar Registro Detallado (CSV)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial Completo de Votos ({allVotes.length})</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total de votos registrados: {Math.ceil(allVotesTotals.total)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold">Votos SÍ</div>
                <div className="text-2xl font-bold text-green-600">
                  {allVotesTotals.yes ? allVotesTotals.yes.toFixed(2) : '0'} ({allVotesTotals.total ? ((allVotesTotals.yes / allVotesTotals.total) * 100).toFixed(1) : '0'}%)
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold">Votos NO</div>
                <div className="text-2xl font-bold text-red-600">
                  {allVotesTotals.no ? allVotesTotals.no.toFixed(2) : '0'} ({allVotesTotals.total ? ((allVotesTotals.no / allVotesTotals.total) * 100).toFixed(1) : '0'}%)
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold">Votos en Blanco</div>
                <div className="text-2xl font-bold text-gray-600">
                  {allVotesTotals.blank ? allVotesTotals.blank.toFixed(2) : '0'} ({allVotesTotals.total ? ((allVotesTotals.blank / allVotesTotals.total) * 100).toFixed(1) : '0'}%)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VotingResults;
