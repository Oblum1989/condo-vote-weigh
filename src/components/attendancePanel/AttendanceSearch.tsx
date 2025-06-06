import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AttendanceData, checkAttendance, registerAttendance } from "@/services/firebaseService";

interface AttendanceSearchProps {
  localVoters: Record<string, { cedula: string; apartment: string }>;
  onAttendanceRegistered: () => Promise<void>;
  onToggleAttendance: (record: AttendanceData) => Promise<void>;
}

const AttendanceSearch = ({
  localVoters,
  onAttendanceRegistered,
  onToggleAttendance,
}: AttendanceSearchProps) => {
  const [searchCedula, setSearchCedula] = useState("");
  const [searchResult, setSearchResult] = useState<AttendanceData | null>(null);
  const { toast } = useToast();

  const handleSearchAttendance = async () => {
    try {
      // Primero buscar si ya está registrado
      const existingAttendance = await checkAttendance(searchCedula);
      if (existingAttendance) {
        setSearchResult(existingAttendance);
        return;
      }

      // Buscar en localVoters
      const voter = Object.values(localVoters).find(v => v.cedula === searchCedula);

      if (!voter) {
        toast({
          title: "No encontrado",
          description: "El votante no está registrado en el sistema",
          variant: "destructive"
        });
        return;
      }

      // Registrar asistencia
      const attendanceData: AttendanceData = {
        cedula: searchCedula,
        apartment: voter.apartment,
        enabled: true,
        timestamp: Date.now()
      };

      await registerAttendance(attendanceData);
      setSearchResult(attendanceData);
      await onAttendanceRegistered();

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
      await onToggleAttendance(record);

      // Actualizar el registro mostrado
      const updatedRecord = { ...record, enabled: !record.enabled };
      setSearchResult(updatedRecord);
    } catch (error) {
      console.error('Error toggling attendance:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado del asistente",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
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
    </div>
  );
};

export default AttendanceSearch;
