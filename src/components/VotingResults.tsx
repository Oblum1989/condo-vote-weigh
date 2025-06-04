
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Circle, Download, RotateCcw, TrendingUp, Clock } from "lucide-react";
import { VoteData, VotingState } from "@/pages/Index";

interface VotingResultsProps {
  votes: VoteData[];
  onReset: () => void;
  onExport: () => void;
  votingState: VotingState;
}

const VotingResults = ({ votes, onReset, onExport, votingState }: VotingResultsProps) => {
  // Calcular resultados con pesos
  const calculateResults = () => {
    const results = {
      si: { count: 0, weight: 0 },
      no: { count: 0, weight: 0 },
      blanco: { count: 0, weight: 0 },
      total: { count: 0, weight: 0 }
    };

    votes.forEach(vote => {
      results[vote.vote].count += 1;
      results[vote.vote].weight += vote.weight;
      results.total.count += 1;
      results.total.weight += vote.weight;
    });

    return results;
  };

  const results = calculateResults();

  const getPercentage = (weight: number, total: number) => {
    return total > 0 ? (weight / total) * 100 : 0;
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

  return (
    <div className="space-y-6">
      {/* Estado de la Votación */}
      {votingState.question && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="text-blue-600" size={24} />
              Información de la Votación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{votingState.question.title}</h3>
                {votingState.question.description && (
                  <p className="text-gray-600">{votingState.question.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Estado: </span>
                  <span className={votingState.isActive ? "text-green-600" : "text-gray-600"}>
                    {votingState.isActive ? "Activa" : "Finalizada"}
                  </span>
                </div>
                
                {votingState.startTime && (
                  <div>
                    <span className="font-medium">Inicio: </span>
                    <span className="text-gray-600">
                      {formatTime(votingState.startTime)}
                    </span>
                  </div>
                )}
                
                {votingState.endTime && (
                  <div>
                    <span className="font-medium">Fin: </span>
                    <span className="text-gray-600">
                      {formatTime(votingState.endTime)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados Principales */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <TrendingUp className="text-blue-600" size={28} />
            Resultados de la Votación
          </CardTitle>
          <p className="text-gray-600">
            Resultados ponderados por peso de voto
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {(['si', 'no', 'blanco'] as const).map((voteType) => {
              const percentage = getPercentage(results[voteType].weight, results.total.weight);
              
              return (
                <Card key={voteType} className="border-2">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-3">
                      {getVoteIcon(voteType)}
                      <span className="ml-2 text-xl font-bold">
                        {getVoteLabel(voteType)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-gray-800">
                        {percentage.toFixed(1)}%
                      </div>
                      
                      <Progress 
                        value={percentage} 
                        className="h-3"
                      />
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Votos: {results[voteType].count}</div>
                        <div>Peso total: {results[voteType].weight.toFixed(2)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Resumen Total */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {results.total.count}
                  </div>
                  <div className="text-sm text-gray-600">Total Votos</div>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {results.total.weight.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Peso Total</div>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {results.total.weight > 0 ? (results.total.weight / results.total.count).toFixed(2) : '0'}
                  </div>
                  <div className="text-sm text-gray-600">Peso Promedio</div>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {new Date().toLocaleTimeString()}
                  </div>
                  <div className="text-sm text-gray-600">Última Actualización</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Historial de Votos Recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Votos Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {votes.slice(-10).reverse().map((vote, index) => (
              <div key={`${vote.id}-${vote.timestamp}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getVoteIcon(vote.vote)}
                  <span className="font-medium">ID: {vote.id}</span>
                  <span className="text-sm text-gray-600">
                    ({getVoteLabel(vote.vote)})
                  </span>
                </div>
                
                <div className="text-right text-sm">
                  <div className="font-medium">Peso: {vote.weight}</div>
                  <div className="text-gray-500">
                    {new Date(vote.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {votes.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No hay votos registrados aún
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={onExport}
          className="flex items-center gap-2"
          disabled={votes.length === 0}
        >
          <Download size={20} />
          Exportar Datos
        </Button>
        
        <Button 
          onClick={onReset}
          variant="destructive"
          className="flex items-center gap-2"
          disabled={votes.length === 0}
        >
          <RotateCcw size={20} />
          Resetear Votación
        </Button>
      </div>
    </div>
  );
};

export default VotingResults;
