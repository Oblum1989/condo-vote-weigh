import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const NoActiveVoting = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <AlertCircle className="mx-auto text-yellow-500 mb-4" size={48} />
          <h3 className="text-lg font-semibold mb-2">Votación no disponible</h3>
          <p className="text-gray-600">
            No hay ninguna votación activa en este momento.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NoActiveVoting;
