import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Check, Plus, Trash } from "lucide-react";
import type { VotingQuestion } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  addQuestion as firebaseAddQuestion,
  deleteQuestion as firebaseDeleteQuestion
} from "@/services/firebaseService";
import { useVotingStore } from "@/store/useVotingStore";

interface QuestionsManagementProps {
  questions: VotingQuestion[];
  onQuestionsChange: () => void;
}

const QuestionsManagement = ({ questions, onQuestionsChange }: QuestionsManagementProps) => {
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    description: "",
    options: ["Sí", "No"] // Dos opciones por defecto
  });
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);

  const { toast } = useToast();
  const votingState = useVotingStore((state) => state.votingState);
  const updateVotingState = useVotingStore((state) => state.updateVotingState);

  const addOption = () => {
    setNewQuestion(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };

  const removeOption = (index: number) => {
    if (newQuestion.options.length <= 2) {
      toast({
        title: "Error",
        description: "Debe haber al menos dos opciones de respuesta",
        variant: "destructive"
      });
      return;
    }
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, value: string) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const createQuestion = async () => {
    if (!newQuestion.title.trim()) {
      toast({
        title: "Error",
        description: "El título de la pregunta es obligatorio",
        variant: "destructive"
      });
      return;
    }

    if (newQuestion.options.length < 2) {
      toast({
        title: "Error",
        description: "Debe haber al menos dos opciones de respuesta",
        variant: "destructive"
      });
      return;
    }

    if (newQuestion.options.some(opt => !opt.trim())) {
      toast({
        title: "Error",
        description: "Todas las opciones deben tener texto",
        variant: "destructive"
      });
      return;
    }

    try {
      const question: Omit<VotingQuestion, 'id'> = {
        title: newQuestion.title,
        description: newQuestion.description,
        options: newQuestion.options,
        isActive: false
      };

      await firebaseAddQuestion(question);
      onQuestionsChange();

      setNewQuestion({ title: "", description: "", options: ["Sí", "No"] });
      setIsCreatingQuestion(false);

      toast({
        title: "Pregunta creada",
        description: "La nueva pregunta ha sido guardada"
      });
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        title: "Error",
        description: "Error al crear pregunta",
        variant: "destructive"
      });
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      try {
        await firebaseDeleteQuestion(questionId);
        onQuestionsChange();

        if (votingState.question?.id === questionId) {
          await updateVotingState({
            isActive: false,
            question: null
          });
        }

        toast({
          title: "Pregunta eliminada",
          description: "La pregunta ha sido eliminada correctamente"
        });
      } catch (error) {
        console.error('Error deleting question:', error);
        toast({
          title: "Error",
          description: "Error al eliminar pregunta",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Check className="text-green-600" size={24} />
          Gestión de Preguntas
        </CardTitle>
        <Dialog open={isCreatingQuestion} onOpenChange={setIsCreatingQuestion}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={20} />
              Nueva Pregunta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Pregunta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Pregunta</Label>
                <Input
                  id="title"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="¿Cuál es su pregunta?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Input
                  id="description"
                  value={newQuestion.description}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción adicional de la pregunta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="options">Opciones de Respuesta</Label>
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      id={`option-${index}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Opción ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={addOption}
                  variant="outline"
                  className="w-full mt-2"
                >
                  <Plus size={16} />
                  Agregar Opción
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={createQuestion} className="flex-1">
                  Crear Pregunta
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingQuestion(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {questions.map((question) => (
            <Card key={question.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{question.title}</h4>
                  <p className="text-sm text-gray-600">{question.description}</p>
                  {votingState.question?.id === question.id && votingState.isActive && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Activa
                    </span>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteQuestion(question.id)}
                  disabled={votingState.question?.id === question.id && votingState.isActive}
                >
                  <Trash size={16} />
                </Button>
              </div>
            </Card>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay preguntas creadas aún
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionsManagement;
