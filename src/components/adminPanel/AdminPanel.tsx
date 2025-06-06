import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import type { VotingQuestion } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { getQuestions } from "@/services/firebaseService";
import StatsPanel from "./StatsPanel";
import ResultsControl from "./ResultsControl";
import QuestionsManagement from "./QuestionsManagement";
import VotingControl from "./VotingControl";

interface AdminPanelProps {
  isAuthenticated: boolean;
  onAuthenticate: (authenticated: boolean) => void;
}

const AdminPanel = ({ isAuthenticated, onAuthenticate }: AdminPanelProps) => {
  const [password, setPassword] = useState("");
  const [questions, setQuestions] = useState<VotingQuestion[]>([]);
  const { toast } = useToast();
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
        <VotingControl questions={questions} />

        {/* Control de Resultados */}
        <ResultsControl />
      </div>

      {/* Gestión de Preguntas */}
      <QuestionsManagement questions={questions} onQuestionsChange={loadQuestions} />
    </div>
  );
};

export default AdminPanel;
