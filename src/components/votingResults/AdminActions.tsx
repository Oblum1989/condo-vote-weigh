import { Button } from "@/components/ui/button";
import { Download, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVotingStore } from "@/store/useVotingStore";

interface AdminActionsProps {
  votes: Array<{ apartment: string; vote: string; weight: number }>;
}

const AdminActions = ({ votes }: AdminActionsProps) => {
  const { toast } = useToast();
  const resetVotes = useVotingStore((state) => state.resetVotes);

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

  return (
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
  );
};

export default AdminActions;
