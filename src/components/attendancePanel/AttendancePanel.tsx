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
    <div className="space-y-6">
      <AttendanceStats
        totalEnabled={totalEnabled}
        totalRegistered={totalRegistered}
      />

      <div className="space-y-6">
        <VoterManagement
          voterWeights={voterWeights}
          localVoters={localVoters}
          onUpdateVoterWeights={updateVoterWeights}
          onLoadVoters={loadVoters}
        />

        {/* Control de Asistencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="text-purple-600" size={24} />
              Control de Asistencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AttendanceSearch
              localVoters={localVoters}
              onAttendanceRegistered={loadAttendance}
              onToggleAttendance={handleToggleAttendance}
            />

            <AttendanceList
              attendance={attendance}
              onToggleAttendance={handleToggleAttendance}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendancePanel;
