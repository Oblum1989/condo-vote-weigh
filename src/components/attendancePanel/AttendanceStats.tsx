import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Percent } from "lucide-react";

interface AttendanceStatsProps {
  totalEnabled: number;
  totalRegistered: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sublabel?: string;
}

const StatCard = ({ icon, value, label, sublabel }: StatCardProps) => (
  <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-6 transition-transform hover:scale-[1.02] duration-200">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-purple-100 rounded-lg text-purple-600">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-purple-700">{value}</div>
        <div className="text-sm font-medium text-gray-600">{label}</div>
        {sublabel && (
          <div className="text-xs text-gray-500 mt-1">{sublabel}</div>
        )}
      </div>
    </div>
  </div>
);

const AttendanceStats = ({ totalEnabled, totalRegistered }: AttendanceStatsProps) => {
  const attendancePercentage =
    totalRegistered > 0
      ? Math.round((totalEnabled / totalRegistered) * 100)
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="text-purple-600" size={24} />
          Estadísticas de Asistencia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={<Users className="h-6 w-6" />}
            value={totalRegistered}
            label="Total Registrados"
            sublabel="Asistentes registrados en el sistema"
          />

          <StatCard
            icon={<UserCheck className="h-6 w-6" />}
            value={totalEnabled}
            label="Habilitados"
            sublabel="Asistentes habilitados para votar"
          />

          <StatCard
            icon={<Percent className="h-6 w-6" />}
            value={`${attendancePercentage}%`}
            label="Porcentaje Habilitado"
            sublabel={`${totalEnabled} de ${totalRegistered} asistentes`}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceStats;
