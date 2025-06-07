import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
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
        <VotingSummary totalVotes={totalVotes} totalWeight={totalWeight} />
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

  return (
    <div className="space-y-6">
      <CurrentQuestion question={votingState.question} />
      <VotingSummary totalVotes={totalVotes} totalWeight={totalWeight} />

      {/* Detailed Results - Only visible when allowed */}
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
