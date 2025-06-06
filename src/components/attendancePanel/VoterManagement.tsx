import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addVoter } from "@/services/firebaseService";

interface VoterManagementProps {
  voterWeights: Record<string, number>;
  localVoters: Record<string, { cedula: string; apartment: string }>;
  onUpdateVoterWeights: (weights: Record<string, number>) => Promise<void>;
  onLoadVoters: () => Promise<void>;
}

const VoterManagement = ({
  voterWeights,
  localVoters,
  onUpdateVoterWeights,
  onLoadVoters,
}: VoterManagementProps) => {
  const { toast } = useToast();

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
          await onUpdateVoterWeights(newWeights);
          await onLoadVoters();
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

  return (
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
  );
};

export default VoterManagement;
