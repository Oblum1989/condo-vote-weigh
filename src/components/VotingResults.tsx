import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RotateCcw, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVotingStore } from "@/store/useVotingStore";
import { VoteData } from "@/types";

interface VotingResultsProps {
  isAdmin?: boolean;
}

const VotingResults = ({ isAdmin = false }: VotingResultsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const votes = useVotingStore((state) => state.votes);
  const votingState = useVotingStore((state) => state.votingState);
  const resetVotes = useVotingStore((state) => state.resetVotes);

  // Calcular totales usando los votos
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

  // Manejar la exportación
  const handleExport = () => {
    const csvContent = votes.map(vote =>
      `${vote.apartment},${vote.vote},${vote.weight}`
    ).join('\n');

    const blob = new Blob([`Apartamento,Voto,Peso\n${csvContent}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados-votacion-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Manejar el reset
  const handleReset = async () => {
    if (confirm('¿Está seguro de que desea resetear los votos?')) {
      try {
        await resetVotes();
        toast({
          title: "Votos resetados",
          description: "Los votos han sido eliminados exitosamente",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron resetear los votos",
          variant: "destructive",
        });
      }
    }
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

  // Calcular resultados
  const totalVotes = votes.length;
  const totalWeight = votes.reduce((sum, vote) => sum + vote.weight, 0);

  if (!isAdmin && !votingState.showResults) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Resumen de la Votación</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
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
      </>
    );
  }

  const results = votes.reduce((acc, vote) => {
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

      {/* Summary - Always visible */}

      {/* Detailed Results - Only visible when allowed */}
      {(isAdmin || votingState.showResults) && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados Detallados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  onClick={handleReset}
                >
                  <RotateCcw size={20} />
                  Resetear Votos
                </Button>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 h-12"
                  onClick={handleExport}
                >
                  <Download size={20} />
                  Exportar Resultados
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VotingResults;
