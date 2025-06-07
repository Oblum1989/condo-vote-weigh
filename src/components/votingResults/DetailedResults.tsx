import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoteData } from "@/types";
import { BarChart } from "lucide-react";
import AdminActions from "./AdminActions";

interface DetailedResultsProps {
  results: Record<string, { count: number; weight: number }>;
  totalWeight: number;
  isAdmin: boolean;
  votes: VoteData[];
}

const DetailedResults = ({ results, totalWeight, isAdmin, votes }: DetailedResultsProps) => {
  const calculatePercentage = (weight: number) => {
    return totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 66) return 'bg-green-500';
    if (percentage >= 33) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  return (
    <Card className="border-2 shadow-md overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100">
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <BarChart className="h-5 w-5 text-purple-600" />
          Resultados Detallados
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        <div className="space-y-6">
          {Object.entries(results).map(([option, data]) => {
            const percentage = calculatePercentage(data.weight);
            const progressColor = getProgressColor(percentage);

            return (
              <div key={option} className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-lg font-bold text-gray-900">
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{data.count} votos</span>
                      <span>•</span>
                      <span>Peso {data.weight.toFixed(1)}</span>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {percentage.toFixed(1)}%
                  </span>
                </div>

                <div className="relative">
                  <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${progressColor} transition-all duration-1000 ease-out`}
                      style={{
                        width: `${percentage}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {isAdmin && (
          <div className="pt-4 border-t">
            <AdminActions votes={votes} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DetailedResults;
