import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  addVoter,
  getAllVoters,
  registerAttendance,
  checkAttendance,
  getAllAttendance,
  AttendanceData
} from "@/services/firebaseService";
import { useVotingStore } from "@/store/useVotingStore";

const AttendancePanel = () => {
  const [searchCedula, setSearchCedula] = useState("");
  const [searchResult, setSearchResult] = useState<AttendanceData | null>(null);
  const [localVoters, setLocalVoters] = useState<Record<string, { cedula: string, apartment: string }>>({});
  const { toast } = useToast();

  // Zustand store
  const voterWeights = useVotingStore((state) => state.voterWeights);
  const attendance = useVotingStore((state) => state.attendance);
  const updateVoterWeights = useVotingStore((state) => state.updateVoterWeights);
  const toggleAttendance = useVotingStore((state) => state.toggleAttendance);
  const setAttendance = useVotingStore((state) => state.setAttendance);

  // Cargar la lista de asistencia inicial
  const loadAttendance = useCallback(async () => {
    try {
      const attendanceList = await getAllAttendance();
      setAttendance(attendanceList);
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast({
        title: "Error",
        description: "Error al cargar la lista de asistencia",
        variant: "destructive"
      });
    }
  }, [setAttendance, toast]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const loadVoters = useCallback(async () => {
    try {
      const votersList = await getAllVoters();
      const votersMap = votersList.reduce((acc, voter) => {
        acc[voter.apartment] = voter;
        return acc;
      }, {} as Record<string, { cedula: string, apartment: string }>);
      setLocalVoters(votersMap);
    } catch (error) {
      console.error('Error loading voters:', error);
      toast({
        title: "Error",
        description: "Error al cargar los votantes",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    loadVoters();
  }, [loadVoters]);

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
      await loadAttendance();

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
      await toggleAttendance(record);
      await loadAttendance();

      // Si el registro actual está siendo mostrado, actualizarlo
      if (searchResult && searchResult.cedula === record.cedula) {
        const updatedRecord = { ...record, enabled: !record.enabled };
        setSearchResult(updatedRecord);
      }

      toast({
        title: "Éxito",
        description: `Asistente ${record.enabled ? "deshabilitado" : "habilitado"} correctamente`
      });
    } catch (error) {
      console.error('Error toggling attendance:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado del asistente",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const newWeights: { [key: string]: number } = {};
        const voterPromises: Promise<void>[] = [];

        const startIndex = lines[0].toLowerCase().includes('cedula') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const [cedula, apartment, weight] = line.split(',').map(value => value.trim());
            const weightValue = parseFloat(weight);

            if (cedula && apartment && !isNaN(weightValue) && weightValue > 0) {
              newWeights[apartment] = weightValue;
              voterPromises.push(addVoter({ cedula, apartment }));
            }
          }
        }
        if (Object.keys(newWeights).length > 0) {
          await Promise.all(voterPromises);
          await updateVoterWeights(newWeights);
          await loadVoters(); // Recargar la lista de votantes
          toast({
            title: "Éxito",
            description: `Se cargaron ${Object.keys(newWeights).length} votantes correctamente`
          });
        } else {
          toast({
            title: "Error",
            description: "No se encontraron datos válidos en el archivo",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error processing CSV:', error);
      toast({
        title: "Error",
        description: "Error al procesar el archivo CSV",
        variant: "destructive"
      });
    }
  };

  const totalEnabled = attendance.filter(record => record.enabled).length;
  const totalRegistered = attendance.length;

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-purple-600" size={24} />
            Estadísticas de Asistencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Asistentes Activos</h3>
              <p className="text-2xl font-bold text-green-600">{totalEnabled}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Total Registrados</h3>
              <p className="text-2xl font-bold text-blue-600">{totalRegistered}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Gestión de Votantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="text-indigo-600" size={24} />
              Gestión de Votantes y Pesos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Importar Votantes desde CSV</h3>
              <p className="text-sm text-gray-600 mb-4">
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
              <h4 className="font-semibold mb-2">
                Votantes Registrados: {Object.keys(voterWeights).length}
              </h4>
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
                        <td className="px-4 py-2">{localVoters[apartment]?.cedula || '-'}</td>
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

        {/* Control de Asistencia */}
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
      </div>
    </div>
  );
};

export default AttendancePanel;
