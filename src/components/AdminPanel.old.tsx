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
  Users,
  Upload,
  BarChart3
} from "lucide-react";
import { VotingState, VotingQuestion, VoterWeights, VoteData } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";
import {
  getQuestions,
  addQuestion as firebaseAddQuestion,
  deleteQuestion as firebaseDeleteQuestion,
  addVoter,
  getAllVoters,
  registerAttendance,
  checkAttendance,
  getAllAttendance,
  updateAttendanceStatus,
  AttendanceData
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
  const [voters, setVoters] = useState<Record<string, { cedula: string, apartment: string }>>({});
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    description: "",
    options: ["", ""] // Dos opciones vacías por defecto
  });
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  // Estado eliminado y movido a AttendancePanel

  const { toast } = useToast();

  // Contraseña de administrador (en producción, esto debería estar en el backend)
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

  // Cargar los datos de los votantes
  const loadVoters = async () => {
    try {
      const votersList = await getAllVoters();
      const votersMap = votersList.reduce((acc, voter) => {
        acc[voter.apartment] = voter;
        return acc;
      }, {} as Record<string, { cedula: string, apartment: string }>);
      setVoters(votersMap);
    } catch (error) {
      console.error('Error loading voters:', error);
    }
  };

  const loadAttendance = useCallback(async () => {
    try {
      const records = await getAllAttendance();
      setAttendance(records);
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast({
        title: "Error",
        description: "Error al cargar los registros de asistencia",
        variant: "destructive"
      });
    }
  }, [toast]);

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

  useEffect(() => {
    if (isAuthenticated) {
      loadQuestions();
      loadVoters();
      loadAttendance();
    }
  }, [isAuthenticated, loadQuestions, loadVoters, loadAttendance]);

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

    // Validar que haya al menos dos opciones
    if (newQuestion.options.length < 2) {
      toast({
        title: "Error",
        description: "Debe haber al menos dos opciones de respuesta",
        variant: "destructive"
      });
      return;
    }

    // Validar que no haya opciones vacías
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

  interface VoterTableData {
    cedula: string;
    apartment: string;
    weight: number;
  }

  // Función para procesar el archivo CSV
  const processCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const weights: VoterWeights = {};
        const voterPromises: Promise<void>[] = [];

        // Saltamos la primera línea si tiene encabezados
        const startIndex = lines[0].toLowerCase().includes('cedula') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const [cedula, apartment, weight] = line.split(',').map(value => value.trim());
            const weightValue = parseFloat(weight);

            if (cedula && apartment && !isNaN(weightValue) && weightValue > 0) {
              weights[apartment] = weightValue;
              // Agregar el votante a la base de datos
              voterPromises.push(addVoter({ cedula, apartment }));
            }
          }
        }

        if (Object.keys(weights).length > 0) {
          await Promise.all(voterPromises);
          await onUpdateVoterWeights(weights);
          await loadVoters(); // Recargar la lista de votantes
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

  const toggleResultVisibility = async () => {
    try {
      await onUpdateVotingState({
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

  const handleSearchAttendance = async () => {
    try {
      // Primero buscar si ya está registrado
      const existingAttendance = await checkAttendance(searchCedula);
      if (existingAttendance) {
        setSearchResult(existingAttendance);
        return;
      }

      // Si no está registrado, buscar en la lista de votantes
      const voter = Object.entries(voters).find(([_, v]) => v.cedula === searchCedula)?.[1];
      if (!voter) {
        toast({
          title: "No encontrado",
          description: "El votante no está registrado en el sistema",
          variant: "destructive"
        });
        return;
      }

      // Registrar asistencia
      const attendanceData = {
        cedula: searchCedula,
        apartment: voter.apartment,
        enabled: true
      };
      await registerAttendance(attendanceData);
      await loadAttendance();
      setSearchResult({
        ...attendanceData,
        timestamp: Date.now()
      });

      toast({
        title: "Éxito",
        description: "Asistencia registrada correctamente"
      });
    } catch (error) {
      console.error('Error searching/registering attendance:', error);
      toast({
        title: "Error",
        description: "Error al procesar la asistencia",
        variant: "destructive"
      });
    }
  };

  const handleToggleAttendance = async (record: AttendanceData) => {
    try {
      await updateAttendanceStatus(record.cedula, !record.enabled);
      await loadAttendance();
      if (searchResult?.cedula === record.cedula) {
        setSearchResult({
          ...record,
          enabled: !record.enabled
        });
      }
      toast({
        title: "Éxito",
        description: `Votante ${record.enabled ? "deshabilitado" : "habilitado"} correctamente`
      });
    } catch (error) {
      console.error('Error toggling attendance:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado del votante",
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

      {/* Gestión de Asistencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-purple-600" size={24} />
            Control de Asistencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="searchCedula">Buscar por Cédula</Label>
              <div className="relative">
                <Input
                  id="searchCedula"
                  type="text"
                  placeholder="Ingrese el número de cédula"
                  value={searchCedula}
                  onChange={(e) => setSearchCedula(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="mt-8"
              onClick={handleSearchAttendance}
              disabled={!searchCedula.trim()}
            >
              Buscar
            </Button>
          </div>

          {searchResult && (
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Cédula: {searchResult.cedula}</h3>
                    <p className="text-sm text-gray-600">Apartamento: {searchResult.apartment}</p>
                    <p className="text-sm text-gray-600">
                      Estado: {searchResult.enabled ? (
                        <span className="text-green-600">Habilitado</span>
                      ) : (
                        <span className="text-red-600">No Habilitado</span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant={searchResult.enabled ? "destructive" : "default"}
                    onClick={() => handleToggleAttendance(searchResult)}
                  >
                    {searchResult.enabled ? "Deshabilitar" : "Habilitar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Asistentes */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Registro de Asistencia</h3>
            <div className="max-h-96 overflow-y-auto rounded-lg border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cédula
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Apartamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hora
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.map((record) => (
                    <tr key={record.cedula} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{record.cedula}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{record.apartment}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.enabled
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}>
                          {record.enabled ? "Habilitado" : "No Habilitado"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          onClick={() => handleToggleAttendance(record)}
                          className={record.enabled ? "text-red-600" : "text-green-600"}
                        >
                          {record.enabled ? "Deshabilitar" : "Habilitar"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <h3 className="font-semibold mb-2">Cargar Votantes desde CSV</h3>              <p className="text-sm text-gray-600 mb-4">
              El archivo CSV debe tener tres columnas: cédula, apartamento y peso del voto.
              <br />
              Ejemplo: 123456789,A101,1.5
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
                  const template = "cedula,apartamento,peso\n123456789,A101,1.5\n987654321,A102,2.0";
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
                    <th className="px-4 py-2 text-left">Cédula</th>
                    <th className="px-4 py-2 text-left">Apartamento</th>
                    <th className="px-4 py-2 text-left">Peso del Voto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(voterWeights).map(([apartment, weight]) => (
                    <tr key={apartment}>
                      <td className="px-4 py-2">{voters[apartment]?.cedula || '-'}</td>
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

    </div>
  );
};

export default AdminPanel;
