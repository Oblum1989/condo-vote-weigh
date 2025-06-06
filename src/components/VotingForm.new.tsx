import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkIfVoted, validateVoter, checkAttendance } from "@/services/firebaseService";
import { useVotingStore } from "@/store/useVotingStore";

interface VotingFormProps {
  isAdmin?: boolean;
}

const VotingForm = ({ isAdmin = false }: VotingFormProps) => {
  const { toast } = useToast();
  const [voterId, setVoterId] = useState("");
  const [apartment, setApartment] = useState("");
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [voteWeight, setVoteWeight] = useState<number | null>(null);

  // Zustand store
  const voterWeights = useVotingStore((state) => state.voterWeights);
  const votingState = useVotingStore((state) => state.votingState);
  const addVote = useVotingStore((state) => state.addVote);

  const handleValidate = async () => {
    if (!voterId.trim() || !apartment.trim()) {
      toast({
        title: "Error",
        description: "Por favor, complete todos los campos",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Realizar todas las validaciones en paralelo
      const [hasVoted, validation, attendance] = await Promise.all([
        checkIfVoted(voterId),
        validateVoter(voterId, apartment),
        checkAttendance(voterId)
      ]);

      if (hasVoted) {
        setValidationError("Esta cédula ya ha votado");
        setIsValidated(false);
        return;
      }

      if (!attendance?.enabled) {
        setValidationError("El votante no está habilitado. Por favor, regístrese en la asistencia.");
        setIsValidated(false);
        return;
      }

      if (!validation.valid) {
        setValidationError(validation.error || "Datos no válidos");
        setIsValidated(false);
        return;
      }

      // Todo válido
      const weight = voterWeights[apartment];
      setVoteWeight(weight);
      setIsValidated(true);
      setValidationError(null);

      toast({
        title: "Validación exitosa",
        description: `Usuario validado. Peso del voto: ${weight}`,
      });
    } catch (error) {
      console.error('Error en validación:', error);
      setValidationError("Error al validar los datos. Por favor, intente nuevamente.");
      setIsValidated(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!votingState.isActive) {
      toast({
        title: "Votación no disponible",
        description: "La votación no está activa en este momento",
        variant: "destructive"
      });
      return;
    }

    if (!isValidated) {
      toast({
        title: "Error",
        description: "Por favor, valide sus datos antes de votar",
        variant: "destructive"
      });
      return;
    }

    if (!selectedVote) {
      toast({
        title: "Error",
        description: "Debe seleccionar una opción de voto",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addVote(voterId, apartment, selectedVote);

      toast({
        title: "¡Voto registrado!",
        description: "Su voto ha sido registrado exitosamente.",
      });

      // Reset form
      setVoterId("");
      setApartment("");
      setSelectedVote(null);
      setIsValidated(false);
      setVoteWeight(null);
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al registrar el voto. Por favor, intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!votingState.isActive || !votingState.question) {
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
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Question Display */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h2 className="text-xl font-semibold">{votingState.question.title}</h2>
              {votingState.question.description && (
                <p className="text-gray-600">{votingState.question.description}</p>
              )}
            </div>

            {/* Validation Section */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="voterId">Número de Cédula</Label>
                <Input
                  id="voterId"
                  type="text"
                  value={voterId}
                  onChange={(e) => setVoterId(e.target.value)}
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
                  onChange={(e) => setApartment(e.target.value)}
                  placeholder="Ingrese su número de apartamento"
                  disabled={isValidating || isSubmitting || isValidated}
                  required
                />
              </div>

              <Button
                type="button"
                onClick={handleValidate}
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

            {/* Voting Options - Solo visible después de validar */}
            {isValidated && (
              <div className="space-y-2">
                <Label>Su Voto</Label>
                <div className={`grid grid-cols-${votingState.question.options.length} gap-4`}>
                  {votingState.question.options.map((option, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant={selectedVote === option.toLowerCase() ? 'default' : 'outline'}
                      onClick={() => setSelectedVote(option.toLowerCase() as 'si' | 'no' | 'blanco')}
                      className="h-16"
                      disabled={isSubmitting}
                    >
                      {option.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button - Solo visible después de validar */}
          {isValidated && (
            <>
              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={!selectedVote || isSubmitting}
              >
                {isSubmitting ? "Registrando voto..." : "CONFIRMAR VOTO"}
              </Button>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="text-amber-600 mt-0.5" size={20} />
                <div className="text-sm text-amber-800">
                  <strong>Importante:</strong> Una vez confirmado el voto, no se puede modificar.
                  Verifique su selección antes de continuar.
                </div>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default VotingForm;
