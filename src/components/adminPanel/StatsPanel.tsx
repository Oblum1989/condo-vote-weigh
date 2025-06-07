import { Users, HelpCircle, Activity, CheckSquare, LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useVotingStore } from "@/store/useVotingStore";
import type { VotingQuestion } from "@/types";

interface StatsPanelProps {
  questions: VotingQuestion[];
}

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  bgColor: string;
  iconColor: string;
  valueColor: string;
}

const StatCard = ({
  icon: Icon,
  value,
  label,
  bgColor,
  iconColor,
  valueColor
}: StatCardProps) => (
  <div className={`rounded-xl ${bgColor} p-6 transition-all duration-200 hover:scale-[1.02] border border-gray-100 shadow-sm`}>
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${iconColor} bg-opacity-20`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div>
        <div className={`text-2xl font-bold ${valueColor}`}>
          {value}
        </div>
        <div className="text-sm font-medium text-gray-600">
          {label}
        </div>
      </div>
    </div>
  </div>
);

const StatsPanel = ({ questions }: StatsPanelProps) => {
  const votes = useVotingStore((state) => state.votes);
  const voterWeights = useVotingStore((state) => state.voterWeights);
  const votingState = useVotingStore((state) => state.votingState);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        icon={Users}
        value={votes.length}
        label="Votos Emitidos"
        bgColor="bg-blue-50"
        iconColor="text-blue-600"
        valueColor="text-blue-700"
      />
      <StatCard
        icon={CheckSquare}
        value={Object.keys(voterWeights).length}
        label="Votantes Registrados"
        bgColor="bg-green-50"
        iconColor="text-green-600"
        valueColor="text-green-700"
      />
      <StatCard
        icon={Activity}
        value={votingState.isActive ? 'ACTIVA' : 'INACTIVA'}
        label="Estado Votación"
        bgColor="bg-purple-50"
        iconColor="text-purple-600"
        valueColor="text-purple-700"
      />
      <StatCard
        icon={HelpCircle}
        value={questions.length}
        label="Preguntas Creadas"
        bgColor="bg-amber-50"
        iconColor="text-amber-600"
        valueColor="text-amber-700"
      />
    </div>
  );
};

export default StatsPanel;
