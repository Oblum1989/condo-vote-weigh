import { useState, useEffect } from "react";
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
import {
  Lock,
  Play,
  Square,
  Plus,
  Settings,
  Trash,
  Check,
  Users,
  Upload
} from "lucide-react";
import { VotingState, VotingQuestion, VoterWeights, VoteData } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";
import {
  getQuestions,
  addQuestion as firebaseAddQuestion,
  deleteQuestion as firebaseDeleteQuestion
} from "@/services/firebaseService";

interface AdminPanelProps {
  votingState: VotingState;
  onUpdateVotingState: (newState: Partial<VotingState>) => void;
  voterWeights: VoterWeights;
  onUpdateVoterWeights: (newWeights: VoterWeights) => void;
  votes: VoteData[];
  isAuthenticated: boolean;
  onAuthenticate: (authenticated: boolean) => void;
}

const AdminPanel = ({
  votingState,
  onUpdateVotingState,
  voterWeights,
  onUpdateVoterWeights,
  votes,
  isAuthenticated,
  onAuthenticate
}: AdminPanelProps) => {
  const [password, setPassword] = useState("");
  const [questions, setQuestions] = useState<VotingQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    description: ""
  });
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const { toast } = useToast();

  // Contraseña de administrador (en producción, esto debería estar en el backend)
  const ADMIN_PASSWORD = "admin123";

  useEffect(() => {
    if (isAuthenticated) {
      loadQuestions();
    }
  }, [isAuthenticated]);

  const loadQuestions = async () => {
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
      // Actualizar el estado de la pregunta
      const updatedQuestion = {
        ...question,
        isActive: true
      };

      // Actualizar el estado de votación
      await onUpdateVotingState({
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
    await onUpdateVotingState({
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

    try {
      const question: Omit<VotingQuestion, 'id'> = {
        title: newQuestion.title,
        description: newQuestion.description,
        options: ["Sí", "No", "En blanco"],
        isActive: false
      };

      await firebaseAddQuestion(question);
      await loadQuestions();

      setNewQuestion({ title: "", description: "" });
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

        // Si es la pregunta activa, detener votación
        if (votingState.question?.id === questionId) {
          await onUpdateVotingState({
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

  // Función para procesar el archivo CSV
  const processCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const weights: VoterWeights = {};

        // Saltamos la primera línea si tiene encabezados
        const startIndex = lines[0].toLowerCase().includes('apartamento') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const [apartment, weight] = line.split(',');
            const cleanApartment = apartment.trim();
            const weightValue = parseFloat(weight.trim());

            if (!isNaN(weightValue) && weightValue > 0) {
              weights[cleanApartment] = weightValue;
            }
          }
        }

        if (Object.keys(weights).length > 0) {
          await onUpdateVoterWeights(weights);
          toast({
            title: "Éxito",
            description: `Se cargaron ${Object.keys(weights).length} votantes correctamente`
          });
        } else {
          toast({
            title: "Error",
            description: "No se encontraron datos válidos en el archivo",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error processing CSV:', error);
        toast({
          title: "Error",
          description: "Error al procesar el archivo CSV",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        toast({
          title: "Error",
          description: "Por favor, sube un archivo CSV válido",
          variant: "destructive"
        });
        return;
      }
      processCSVFile(file);
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

      {/* Gestión de Votantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-indigo-600" size={24} />
            Gestión de Votantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Cargar Votantes desde CSV</h3>
            <p className="text-sm text-gray-600 mb-4">
              El archivo CSV debe tener dos columnas: apartamento y peso del voto.
              <br />
              Ejemplo: A101,1.5
            </p>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => {
                  const template = "apartamento,peso\nA101,1.5\nA102,2.0";
                  const blob = new Blob([template], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'plantilla_votantes.csv';
                  a.click();
                }}
              >
                Descargar Plantilla
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Votantes Registrados: {Object.keys(voterWeights).length}</h4>
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Apartamento</th>
                    <th className="px-4 py-2 text-left">Peso del Voto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(voterWeights).map(([apartment, weight]) => (
                    <tr key={apartment}>
                      <td className="px-4 py-2">{apartment}</td>
                      <td className="px-4 py-2">{weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-purple-600" size={24} />
            Estadísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{votes.length}</div>
              <div className="text-sm text-gray-600">Votos Emitidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(voterWeights).length}
              </div>
              <div className="text-sm text-gray-600">Votantes Registrados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {votingState.isActive ? 'ACTIVA' : 'INACTIVA'}
              </div>
              <div className="text-sm text-gray-600">Estado Votación</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{questions.length}</div>
              <div className="text-sm text-gray-600">Preguntas Creadas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de Cerrar Sesión */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => onAuthenticate(false)}
          className="flex items-center gap-2"
        >
          <Lock size={20} />
          Cerrar Sesión de Admin
        </Button>
      </div>
    </div>
  );
};

export default AdminPanel;
