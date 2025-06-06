import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface AttendanceStatsProps {
  totalEnabled: number;
  totalRegistered: number;
}

const AttendanceStats = ({ totalEnabled, totalRegistered }: AttendanceStatsProps) => {
  return (
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
            <p className="text-2xl font-bold text-green-600">{totalRegistered}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceStats;
