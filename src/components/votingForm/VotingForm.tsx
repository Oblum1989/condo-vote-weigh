import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkIfVoted, validateVoter, checkAttendance } from "@/services/firebaseService";
import { useVotingStore } from "@/store/useVotingStore";
import ValidationSection from "./ValidationSection";
import VotingOptions from "./VotingOptions";
import NoActiveVoting from "./NoActiveVoting";

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
    return <NoActiveVoting />;
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

            {!isValidated ? (
              <ValidationSection
                voterId={voterId}
                apartment={apartment}
                isValidating={isValidating}
                isSubmitting={isSubmitting}
                isValidated={isValidated}
                validationError={validationError}
                voteWeight={voteWeight}
                onVoterIdChange={setVoterId}
                onApartmentChange={setApartment}
                onValidate={handleValidate}
              />
            ) : (
              <>
                <VotingOptions
                  options={votingState.question.options}
                  selectedVote={selectedVote}
                  isSubmitting={isSubmitting}
                  onVoteSelect={(vote) => setSelectedVote(vote as 'si' | 'no' | 'blanco')}
                />

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
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VotingForm;
