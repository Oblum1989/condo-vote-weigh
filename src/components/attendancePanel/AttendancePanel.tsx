import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAllVoters,
  getAllAttendance,
  AttendanceData
} from "@/services/firebaseService";
import { useVotingStore } from "@/store/useVotingStore";
import AttendanceList from "./AttendanceList";
import VoterManagement from "./VoterManagement";
import AttendanceSearch from "./AttendanceSearch";
import AttendanceStats from "./AttendanceStats";

const AttendancePanel = () => {
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

  const handleToggleAttendance = async (record: AttendanceData) => {
    try {
      await toggleAttendance(record);
      await loadAttendance();

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

  const totalEnabled = attendance.filter(record => record.enabled).length;
  const totalRegistered = attendance.length;

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 shadow-md">
        <AttendanceStats
          totalEnabled={totalEnabled}
          totalRegistered={totalRegistered}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Voter Management Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 ml-1">
            Gestión de Votantes
          </h2>
          <VoterManagement
            voterWeights={voterWeights}
            localVoters={localVoters}
            onUpdateVoterWeights={updateVoterWeights}
            onLoadVoters={loadVoters}
          />
        </div>

        {/* Attendance Control Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 ml-1">
            Control de Asistencia
          </h2>
          <Card className="border-2 shadow-md overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Users className="text-purple-600" size={24} />
                Registro y Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Search and Register Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <AttendanceSearch
                  localVoters={localVoters}
                  onAttendanceRegistered={loadAttendance}
                  onToggleAttendance={handleToggleAttendance}
                />
              </div>

              {/* Attendance List Section */}
              <div className="bg-white rounded-lg border border-gray-200">
                <AttendanceList
                  attendance={attendance}
                  onToggleAttendance={handleToggleAttendance}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AttendancePanel;
