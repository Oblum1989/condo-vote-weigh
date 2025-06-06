import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Circle, AlertCircle } from "lucide-react";
import { VoteData, VoterWeights, VotingState } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";
import { checkIfVoted, validateVoter, checkAttendance } from "@/services/firebaseService";

interface VotingFormProps {
  onVote: (voterId: string, apartment: string, vote: string) => Promise<void>;
  voterWeights: VoterWeights;
  existingVotes: VoteData[];
  votingState: VotingState;
}

const VotingForm = ({ onVote, voterWeights, existingVotes, votingState }: VotingFormProps) => {
  const [voterId, setVoterId] = useState("");
  const [apartment, setApartment] = useState("");
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingVote, setCheckingVote] = useState(false);
  const [validationState, setValidationState] = useState<{
    voterId: { isValid: boolean; message: string | null } | null;
    apartment: { isValid: boolean; message: string | null } | null;
  }>({ voterId: null, apartment: null });
  const [isAttendanceEnabled, setIsAttendanceEnabled] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Verificar si el ID ya votó en Firebase
  useEffect(() => {
    const checkVoteStatus = async () => {
      if (voterId.trim() && apartment.trim()) {
        setCheckingVote(true);
        try {
          const voted = await checkIfVoted(voterId);
          setHasVoted(voted);
        } catch (error) {
          console.error('Error checking vote status:', error);
        }
        setCheckingVote(false);
      } else {
        setHasVoted(false);
      }
    };

    const timeoutId = setTimeout(checkVoteStatus, 500);
    return () => clearTimeout(timeoutId);
  }, [voterId, apartment]);

  // Efecto para validar el ID y apartamento
  useEffect(() => {
    const validateFields = async () => {
      if (voterId.trim() && apartment.trim()) {
        const validation = await validateVoter(voterId, apartment);
        if (validation.valid) {
          const weight = voterWeights[apartment];
          setValidationState({
            voterId: { isValid: true, message: `ID válido - Peso del voto: ${weight}` },
            apartment: { isValid: true, message: `Apartamento válido` }
          });
        } else {
          setValidationState({
            voterId: { isValid: false, message: "ID no encontrado en la base de datos" },
            apartment: { isValid: false, message: validation.error || "Datos no válidos" }
          });
        }
      } else {
        setValidationState({
          voterId: voterId.trim() ? null : { isValid: false, message: "La cédula es obligatoria" },
          apartment: apartment.trim() ? null : { isValid: false, message: "El apartamento es obligatorio" }
        });
      }
    };

    const timeoutId = setTimeout(validateFields, 500);
    return () => clearTimeout(timeoutId);
  }, [voterId, apartment, voterWeights]);

  // Verificar asistencia cuando se ingresa la cédula
  useEffect(() => {
    const checkAttendanceStatus = async () => {
      if (voterId.trim()) {
        try {
          const attendance = await checkAttendance(voterId);
          setIsAttendanceEnabled(attendance?.enabled ?? false);
        } catch (error) {
          console.error('Error checking attendance:', error);
          setIsAttendanceEnabled(false);
        }
      } else {
        setIsAttendanceEnabled(null);
      }
    };

    const timeoutId = setTimeout(checkAttendanceStatus, 500);
    return () => clearTimeout(timeoutId);
  }, [voterId]);

  const validateVoterId = (id: string) => {
    if (!id.trim()) {
      return "La cédula es obligatoria";
    }
    return null;
  };

  const validateApartment = (apt: string) => {
    if (!apt.trim()) {
      return "El número de apartamento es obligatorio";
    }
    if (!(apt in voterWeights)) {
      return "Apartamento no encontrado en la base de datos";
    }
    return null;
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

    if (!selectedVote) {
      toast({
        title: "Error",
        description: "Debe seleccionar una opción de voto",
        variant: "destructive"
      });
      return;
    }

    if (!isAttendanceEnabled) {
      toast({
        title: "No habilitado",
        description: "El votante no está habilitado para votar. Por favor, regístrese en la asistencia.",
        variant: "destructive"
      });
      return;
    }

    // Validación básica
    const voterIdError = validateVoterId(voterId);
    if (voterIdError) {
      toast({
        title: "Error",
        description: voterIdError,
        variant: "destructive"
      });
      return;
    }

    const apartmentError = validateApartment(apartment);
    if (apartmentError) {
      toast({
        title: "Error",
        description: apartmentError,
        variant: "destructive"
      });
      return;
    }

    // Validación contra Firebase
    const validation = await validateVoter(voterId, apartment);
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.error || "Error de validación",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await onVote(voterId, apartment, selectedVote);

      toast({
        title: "¡Voto registrado!",
        description: "Su voto ha sido registrado exitosamente.",
      });

      // Reset form
      setVoterId("");
      setApartment("");
      setSelectedVote(null);
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: "Error al registrar el voto. Por favor, intente nuevamente.",
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

            {/* Voter ID Input */}
            <div className="space-y-2">
              <Label htmlFor="voterId">Número de Cédula</Label>
              <div className="relative">
                <Input
                  id="voterId"
                  type="text"
                  value={voterId}
                  onChange={(e) => setVoterId(e.target.value)}
                  placeholder="Ingrese su número de cédula"
                  disabled={isSubmitting || checkingVote}
                  required
                  className={voterId.trim() ? (validationState.voterId?.isValid ? "pr-24 border-green-500" : "pr-24 border-red-500") : ""}
                />
                {voterId.trim() && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm">
                    {validationState.voterId?.isValid ? (
                      <>
                        <CheckCircle className="text-green-500 mr-2" size={18} />
                        <span className="text-green-700">{validationState.voterId.message}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="text-red-500 mr-2" size={18} />
                        <span className="text-red-700">{validationState.voterId?.message}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Apartment Input */}
            <div className="space-y-2">
              <Label htmlFor="apartment">Número de Apartamento</Label>
              <div className="relative">
                <Input
                  id="apartment"
                  type="text"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  placeholder="Ingrese su número de apartamento"
                  disabled={isSubmitting || checkingVote}
                  required
                  className={apartment.trim() ? (validationState.apartment?.isValid ? "pr-24 border-green-500" : "pr-24 border-red-500") : ""}
                />
                {apartment.trim() && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm">
                    {validationState.apartment?.isValid ? (
                      <>
                        <CheckCircle className="text-green-500 mr-2" size={18} />
                        <span className="text-green-700">{validationState.apartment.message}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="text-red-500 mr-2" size={18} />
                        <span className="text-red-700">{validationState.apartment?.message}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Voting Options */}
            <div className="space-y-2">
              <Label>Su Voto</Label>
              <div className={`grid grid-cols-${votingState.question.options.length + 1} gap-4`}>
                {votingState.question.options.map((option, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={selectedVote === option.toLowerCase() ? 'default' : 'outline'}
                    onClick={() => setSelectedVote(option.toLowerCase() as 'si' | 'no' | 'blanco')}
                    className="h-16"
                    disabled={isSubmitting || checkingVote}
                  >
                    {option.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Attendance Warning */}
          {voterId.trim() && isAttendanceEnabled === false && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={20} />
                <span className="font-medium">No habilitado para votar</span>
              </div>
              <p className="mt-1 text-sm text-red-600">
                Por favor, regístrese en la asistencia antes de votar.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={!voterId || !apartment || !selectedVote || isSubmitting || checkingVote}
          >
            {isSubmitting ? "Registrando voto..." : "CONFIRMAR VOTO"}
          </Button>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="text-amber-600 mt-0.5" size={20} />
            <div className="text-sm text-amber-800">
              <strong>Importante:</strong> Una vez confirmado el voto, no se puede modificar.
              Verifique su selección antes de continuar.
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VotingForm;
