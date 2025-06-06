import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Lock,
  Play,
  Square,
  Plus,
  Settings,
  Trash,
  Check,
  BarChart3
} from "lucide-react";
import type { VotingQuestion } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  getQuestions,
  addQuestion as firebaseAddQuestion,
  deleteQuestion as firebaseDeleteQuestion
} from "@/services/firebaseService";
import { useVotingStore } from "@/store/useVotingStore";
import StatsPanel from "./StatsPanel";

interface AdminPanelProps {
  isAuthenticated: boolean;
  onAuthenticate: (authenticated: boolean) => void;
}

const AdminPanel = ({ isAuthenticated, onAuthenticate }: AdminPanelProps) => {
  const [password, setPassword] = useState("");
  const [questions, setQuestions] = useState<VotingQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    description: "",
    options: ["Sí", "No"] // Dos opciones por defecto
  });
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);

  const { toast } = useToast();

  // Zustand store
  const votingState = useVotingStore((state) => state.votingState);
  const updateVotingState = useVotingStore((state) => state.updateVotingState);

  const ADMIN_PASSWORD = "admin123";

  const loadQuestions = useCallback(async () => {
    try {
      const loadedQuestions = await getQuestions();
      setQuestions(loadedQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Error al cargar preguntas",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    if (isAuthenticated) {
      loadQuestions();
    }
  }, [isAuthenticated, loadQuestions]);

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

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      onAuthenticate(true);
      toast({
        title: "Acceso concedido",
        description: "Bienvenido al panel de administración"
      });
    } else {
      toast({
        title: "Error",
        description: "Contraseña incorrecta",
        variant: "destructive"
      });
    }
  };

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
      await loadQuestions();

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
        await loadQuestions();

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

  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="text-orange-600" size={24} />
            Panel de Administración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña de Administrador</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese la contraseña"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button onClick={handleLogin} className="w-full">
            Iniciar Sesión
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <StatsPanel questions={questions} />

      {/* Control de Votación y Resultados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Control de Votación */}
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

        {/* Control de Resultados */}
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
      </div>

      {/* Gestión de Preguntas */}
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
    </div>
  );
};

export default AdminPanel;
