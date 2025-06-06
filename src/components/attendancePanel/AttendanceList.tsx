import { Button } from "@/components/ui/button";
import { AttendanceData } from "@/services/firebaseService";

interface AttendanceListProps {
  attendance: AttendanceData[];
  onToggleAttendance: (record: AttendanceData) => void;
}

const AttendanceList = ({ attendance, onToggleAttendance }: AttendanceListProps) => {
  return (
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
                    onClick={() => onToggleAttendance(record)}
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
  );
};

export default AttendanceList;
