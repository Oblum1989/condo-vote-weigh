import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVotingStore } from "@/store/useVotingStore";
import type { VotingQuestion } from "@/types";

interface StatsPanelProps {
  questions: VotingQuestion[];
}

const StatsPanel = ({ questions }: StatsPanelProps) => {
  // Zustand store
  const votes = useVotingStore((state) => state.votes);
  const voterWeights = useVotingStore((state) => state.voterWeights);
  const votingState = useVotingStore((state) => state.votingState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="text-purple-600" size={24} />
          Estadísticas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{votes.length}</div>
            <div className="text-sm text-gray-600">Votos Emitidos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.keys(voterWeights).length}
            </div>
            <div className="text-sm text-gray-600">Votantes Registrados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {votingState.isActive ? 'ACTIVA' : 'INACTIVA'}
            </div>
            <div className="text-sm text-gray-600">Estado Votación</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{questions.length}</div>
            <div className="text-sm text-gray-600">Preguntas Creadas</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsPanel;
