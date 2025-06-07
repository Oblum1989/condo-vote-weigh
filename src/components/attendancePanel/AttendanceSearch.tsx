import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { registerAttendance, AttendanceData } from "@/services/firebaseService";

interface AttendanceSearchProps {
  localVoters: Record<string, { cedula: string; apartment: string }>;
  onAttendanceRegistered: () => Promise<void>;
  onToggleAttendance: (record: AttendanceData) => Promise<void>;
}

const AttendanceSearch = ({
  localVoters,
  onAttendanceRegistered,
  onToggleAttendance
}: AttendanceSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();

  const handleRegister = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingrese una cédula para buscar",
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);
    try {
      const foundVoter = Object.values(localVoters).find(
        voter => voter.cedula === searchTerm
      );

      if (!foundVoter) {
        toast({
          title: "No encontrado",
          description: "No se encontró un votante con esta cédula",
          variant: "destructive"
        });
        return;
      }

      await registerAttendance({
        cedula: foundVoter.cedula,
        apartment: foundVoter.apartment,
        enabled: true
      });

      await onAttendanceRegistered();
      setSearchTerm("");

      toast({
        title: "Éxito",
        description: "Asistencia registrada correctamente"
      });
    } catch (error) {
      console.error('Error registering attendance:', error);
      toast({
        title: "Error",
        description: "Error al registrar la asistencia",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-semibold text-gray-700">
          Buscar por Cédula
        </Label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ingrese el número de cédula"
              className="pl-10 h-12 border-2 focus:border-purple-400"
              onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
            />
          </div>
          <Button
            onClick={handleRegister}
            disabled={isRegistering || !searchTerm.trim()}
            className="h-12 px-6 bg-purple-600 hover:bg-purple-700 transition-all duration-200 
                     hover:scale-[1.02] active:scale-[0.98] flex items-center"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            <span>{isRegistering ? "Registrando..." : "Registrar"}</span>
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
        <div className="text-sm text-amber-800">
          <strong>Nota:</strong> El votante debe estar previamente registrado en el sistema.
          Solo se pueden registrar asistencias para votantes válidos.
        </div>
      </div>
    </div>
  );
};

export default AttendanceSearch;
