import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoteData } from "@/types";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados Detallados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {isAdmin && <AdminActions votes={votes} />}
      </CardContent>
    </Card>
  );
};

export default DetailedResults;
