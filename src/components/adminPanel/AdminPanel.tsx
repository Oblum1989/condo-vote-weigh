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
      <div className="max-w-md mx-auto">
        <Card className="border-2 shadow-lg overflow-hidden">
          <CardHeader className="text-center border-b bg-gradient-to-r from-orange-50 to-orange-100 pb-8">
            <CardTitle className="flex flex-col items-center gap-4">
              <div className="p-4 bg-orange-100 rounded-full">
                <Lock className="text-orange-600" size={32} />
              </div>
              <div className="text-2xl font-bold text-gray-800">
                Panel de Administración
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Contraseña de Administrador
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese la contraseña"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="pr-10 h-12 border-2 focus:border-orange-400"
                />
                <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <Button
              onClick={handleLogin}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 
                       hover:from-orange-600 hover:to-orange-700 shadow-md transition-all duration-200 
                       hover:scale-[1.02] active:scale-[0.98]"
            >
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Statistics Panel */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 shadow-md">
        <StatsPanel questions={questions} />
      </div>

      {/* Control Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800 ml-1 mb-3">Control de Votación</h2>
          <VotingControl questions={questions} />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800 ml-1 mb-3">Control de Resultados</h2>
          <ResultsControl />
        </div>
      </div>

      {/* Questions Management */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800 ml-1 mb-3">Gestión de Preguntas</h2>
        <QuestionsManagement
          questions={questions}
          onQuestionsChange={loadQuestions}
        />
      </div>
    </div>
  );
};

export default AdminPanel;
