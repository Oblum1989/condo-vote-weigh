import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Loader2 } from "lucide-react";
import { useVotingStore } from "@/store/useVotingStore";
import CurrentQuestion from "./CurrentQuestion";
import VotingSummary from "./VotingSummary";
import DetailedResults from "./DetailedResults";

interface VotingResultsProps {
  isAdmin?: boolean;
}

const VotingResults = ({ isAdmin = false }: VotingResultsProps) => {
  const [loading, setLoading] = useState(false);
  const votes = useVotingStore((state) => state.votes);
  const votingState = useVotingStore((state) => state.votingState);

  if (loading) {
    return (
      <Card className="border-2 shadow-md">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Cargando resultados</h3>
              <p className="text-sm text-gray-500">Por favor espere un momento...</p>
            </div>
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
      <div className="space-y-6">
        <VotingSummary totalVotes={totalVotes} totalWeight={totalWeight} />
        <Card className="border-2 shadow-md overflow-hidden">
          <CardContent className="pt-8 pb-10">
            <div className="text-center space-y-4">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                <Lock className="text-gray-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Resultados no disponibles</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Los resultados serán visibles cuando el administrador lo habilite.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const results = votes.reduce((acc, vote) => {
    acc[vote.vote] = {
      count: (acc[vote.vote]?.count || 0) + 1,
      weight: (acc[vote.vote]?.weight || 0) + vote.weight
    };
    return acc;
  }, {} as Record<string, { count: number; weight: number }>);

  return (
    <div className="space-y-6">
      <CurrentQuestion question={votingState.question} />
      <VotingSummary totalVotes={totalVotes} totalWeight={totalWeight} />
      {(isAdmin || votingState.showResults) && (
        <DetailedResults
          results={results}
          totalWeight={totalWeight}
          isAdmin={isAdmin}
          votes={votes}
        />
      )}
    </div>
  );
};

export default VotingResults;
