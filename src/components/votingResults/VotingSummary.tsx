import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

interface VotingSummaryProps {
  totalVotes: number;
  totalWeight: number;
}

const VotingSummary = ({ totalVotes, totalWeight }: VotingSummaryProps) => {
  return (
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
  );
};

export default VotingSummary;
