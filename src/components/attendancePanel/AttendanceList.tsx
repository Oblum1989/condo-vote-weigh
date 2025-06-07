import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserCheck, UserX } from "lucide-react";
import { AttendanceData } from "@/services/firebaseService";

interface AttendanceListProps {
  attendance: AttendanceData[];
  onToggleAttendance: (record: AttendanceData) => Promise<void>;
}

const AttendanceList = ({ attendance, onToggleAttendance }: AttendanceListProps) => {
  const sortedAttendance = [...attendance].sort((a, b) => {
    // Sort by enabled status first, then by timestamp (most recent first)
    if (a.enabled !== b.enabled) return b.enabled ? 1 : -1;
    return b.timestamp - a.timestamp;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Lista de Asistencia
        </h3>
        <div className="text-sm text-gray-500">
          Total: {attendance.length}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cédula
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apartamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAttendance.map((record) => (
                <tr
                  key={record.cedula}
                  className={`hover:bg-gray-50 transition-colors ${record.enabled ? 'bg-green-50 bg-opacity-30' : 'bg-red-50 bg-opacity-30'
                    }`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {record.cedula}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {record.apartment}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(record.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {record.enabled ? (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <UserX className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${record.enabled ? 'text-green-700' : 'text-red-700'
                        }`}>
                        {record.enabled ? 'Habilitado' : 'Deshabilitado'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Switch
                        checked={record.enabled}
                        onCheckedChange={() => onToggleAttendance(record)}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <Label className="text-xs text-gray-500">
                        {record.enabled ? 'Deshabilitar' : 'Habilitar'}
                      </Label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {attendance.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay registros de asistencia
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceList;
