import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface ValidationSectionProps {
  voterId: string;
  apartment: string;
  isValidating: boolean;
  isSubmitting: boolean;
  isValidated: boolean;
  validationError: string | null;
  voteWeight: number | null;
  onVoterIdChange: (value: string) => void;
  onApartmentChange: (value: string) => void;
  onValidate: () => void;
}

const ValidationSection = ({
  voterId,
  apartment,
  isValidating,
  isSubmitting,
  isValidated,
  validationError,
  voteWeight,
  onVoterIdChange,
  onApartmentChange,
  onValidate,
}: ValidationSectionProps) => {
  return (
    <>
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="voterId">Número de Cédula</Label>
          <Input
            id="voterId"
            type="text"
            value={voterId}
            onChange={(e) => onVoterIdChange(e.target.value)}
            placeholder="Ingrese su número de cédula"
            disabled={isValidating || isSubmitting || isValidated}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apartment">Número de Apartamento</Label>
          <Input
            id="apartment"
            type="text"
            value={apartment}
            onChange={(e) => onApartmentChange(e.target.value)}
            placeholder="Ingrese su número de apartamento"
            disabled={isValidating || isSubmitting || isValidated}
            required
          />
        </div>

        <Button
          type="button"
          onClick={onValidate}
          disabled={isValidating || isSubmitting || isValidated}
          className="w-full"
        >
          {isValidating ? "Validando..." : "Validar Datos"}
        </Button>
      </div>

      {/* Validation Status */}
      {validationError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle size={20} />
            <span className="font-medium">Error de validación</span>
          </div>
          <p className="mt-1 text-sm text-red-600">
            {validationError}
          </p>
        </div>
      )}

      {isValidated && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle size={20} />
            <span className="font-medium">Datos validados correctamente</span>
          </div>
          <p className="mt-1 text-sm text-green-600">
            Peso del voto: {voteWeight}
          </p>
        </div>
      )}
    </>
  );
};

export default ValidationSection;
