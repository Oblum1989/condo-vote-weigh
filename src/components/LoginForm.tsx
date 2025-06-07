import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, Settings, Users } from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  role: UserRole;
  title: string;
  onSuccess?: () => void;
}

const LoginForm = ({ role, title, onSuccess }: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = login(username, password, role);

    if (success) {
      toast({
        title: "Acceso concedido",
        description: `Bienvenido ${title}`
      });
      onSuccess?.();
    } else {
      toast({
        title: "Error de autenticación",
        description: "Usuario o contraseña incorrectos",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  const getIcon = () => {
    if (role === 'admin_votacion') return <Settings className="text-blue-600" size={24} />;
    if (role === 'admin_asistencias') return <Users className="text-green-600" size={24} />;
    return <Lock className="text-gray-600" size={24} />;
  };

  return (
    <Card className="max-w-md mx-auto shadow-lg border-2">
      <CardHeader className="text-center space-y-2 pb-6">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
          {getIcon()}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-8 p-5 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
          <h3 className="font-bold text-lg text-blue-900 mb-3">Credenciales de Acceso:</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong>Usuario:</strong> admin_votacion<br />
            <strong>Contraseña:</strong> admin123
          </p>
          <p className="text-xs text-gray-600 mt-3 italic">
            Nota: En un ambiente de producción, estas credenciales serían diferentes y seguras.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
              Usuario
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingrese su nombre de usuario"
                className="pl-10 h-12 border-2 focus:border-blue-400"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                className="pl-10 h-12 border-2 focus:border-blue-400"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold shadow-md transition-all 
                     hover:scale-[1.02] active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? "Autenticando..." : "Iniciar Sesión"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
