import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useVotingStore } from "@/store/useVotingStore";

const ResultsControl = () => {
  const { toast } = useToast();
  const votingState = useVotingStore((state) => state.votingState);
  const updateVotingState = useVotingStore((state) => state.updateVotingState);

  const toggleResultVisibility = async () => {
    try {
      await updateVotingState({
        showResults: !votingState.showResults
      });

      toast({
        title: votingState.showResults ? "Resultados ocultados" : "Resultados visibles",
        description: votingState.showResults
          ? "Los resultados ya no son visibles para los votantes"
          : "Los resultados son ahora visibles para los votantes"
      });
    } catch (error) {
      console.error('Error toggling result visibility:', error);
      toast({
        title: "Error",
        description: "Error al cambiar la visibilidad de los resultados",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="text-orange-600" size={24} />
          Control de Resultados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={votingState.showResults}
            onCheckedChange={toggleResultVisibility}
            id="show-results"
          />
          <Label htmlFor="show-results">
            Mostrar resultados a los votantes
          </Label>
        </div>
        <p className="text-sm text-gray-600">
          {votingState.showResults
            ? "Los resultados son visibles para todos los votantes"
            : "Los resultados solo son visibles para los administradores"}
        </p>
      </CardContent>
    </Card>
  );
};

export default ResultsControl;
