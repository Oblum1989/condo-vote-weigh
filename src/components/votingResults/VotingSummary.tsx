import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Users, Scale } from "lucide-react";

interface VotingSummaryProps {
  totalVotes: number;
  totalWeight: number;
}

const VotingSummary = ({ totalVotes, totalWeight }: VotingSummaryProps) => {
  return (
    <Card className="border-2 shadow-md overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
        <CardTitle className="text-xl text-gray-800">Resumen de la Votación</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 pb-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm transition-transform hover:scale-[1.02]">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-blue-600">{totalVotes}</div>
                <div className="text-sm font-medium text-blue-700">Votos Totales</div>
              </div>
            </div>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm transition-transform hover:scale-[1.02]">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <Scale className="h-6 w-6 text-green-600" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-green-600">
                  {totalWeight.toFixed(1)}
                </div>
                <div className="text-sm font-medium text-green-700">Peso Total</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VotingSummary;
