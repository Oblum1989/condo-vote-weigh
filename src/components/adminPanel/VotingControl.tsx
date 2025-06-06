import { Settings, Play, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import type { VotingQuestion } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useVotingStore } from "@/store/useVotingStore";

interface VotingControlProps {
  questions: VotingQuestion[];
}

const VotingControl = ({ questions }: VotingControlProps) => {
  const { toast } = useToast();
  const votingState = useVotingStore((state) => state.votingState);
  const updateVotingState = useVotingStore((state) => state.updateVotingState);

  const startVoting = async (question: VotingQuestion) => {
    try {
      const updatedQuestion = {
        ...question,
        isActive: true
      };
      await updateVotingState({
        isActive: true,
        question: updatedQuestion,
        startTime: Date.now()
      });

      toast({
        title: "Votación iniciada",
        description: `La votación "${question.title}" está ahora activa`
      });
    } catch (error) {
      console.error('Error starting vote:', error);
      toast({
        title: "Error",
        description: "Error al iniciar la votación",
        variant: "destructive"
      });
    }
  };

  const stopVoting = async () => {
    await updateVotingState({
      isActive: false,
      endTime: Date.now()
    });
    toast({
      title: "Votación finalizada",
      description: "La votación ha sido detenida"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="text-blue-600" size={24} />
          Control de Votación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {votingState.question && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-lg">{votingState.question.title}</h3>
            <p className="text-gray-600">{votingState.question.description}</p>
          </div>
        )}

        <div className="flex gap-4">
          {!votingState.isActive ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Play size={20} />
                  Iniciar Votación
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Seleccionar Pregunta para Votar</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {questions.map((question) => (
                    <Card key={question.id} className="p-4">
                      <h4 className="font-semibold">{question.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{question.description}</p>
                      <Button
                        onClick={() => startVoting(question)}
                        className="w-full"
                      >
                        Iniciar con esta pregunta
                      </Button>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              onClick={stopVoting}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square size={20} />
              Detener Votación
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VotingControl;
