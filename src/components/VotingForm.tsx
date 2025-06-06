import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkIfVoted, validateVoter, checkAttendance } from "@/services/firebaseService";
import { useVotingStore } from "@/store/useVotingStore";
import { useDebounce } from "@/hooks/use-debounce";
import { ValidationResult, AttendanceStatus, CachedData, ValidationResponse } from "@/types/validation";

// Cache para almacenar resultados de validación
type CacheValue = boolean | ValidationResult | AttendanceStatus;
const validationCache = new Map<string, CachedData<CacheValue>>();

// Tiempo de expiración del caché (5 minutos)
const CACHE_EXPIRATION = 5 * 60 * 1000;

interface VotingFormProps {
  isAdmin?: boolean;
}

const VotingForm = ({ isAdmin = false }: VotingFormProps) => {
  const { toast } = useToast();
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
  const lastValidationTime = useRef<number>(0);

  // Zustand store
  const voterWeights = useVotingStore((state) => state.voterWeights);
  const votingState = useVotingStore((state) => state.votingState);
  const addVote = useVotingStore((state) => state.addVote);

  // Debounce los valores de input para reducir las validaciones
  const debouncedVoterId = useDebounce(voterId, 800);
  const debouncedApartment = useDebounce(apartment, 800);

  // Funciones específicas de caché para cada tipo de dato
  const getCachedVoteStatus = useCallback(async (id: string): Promise<boolean> => {
    const key = `vote-${id}`;
    const cached = validationCache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_EXPIRATION) {
      return cached.data as boolean;
    }

    const data = await checkIfVoted(id);
    validationCache.set(key, { timestamp: now, data });
    return data;
  }, []);

  const getCachedValidation = useCallback(async (id: string, apt: string): Promise<ValidationResult> => {
    const key = `${id}-${apt}`;
    const cached = validationCache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_EXPIRATION) {
      return cached.data as ValidationResult;
    }

    const data = await validateVoter(id, apt);
    validationCache.set(key, { timestamp: now, data });
    return data;
  }, []);

  const getCachedAttendance = useCallback(async (id: string): Promise<AttendanceStatus> => {
    const key = `attendance-${id}`;
    const cached = validationCache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_EXPIRATION) {
      return cached.data as AttendanceStatus;
    }

    const data = await checkAttendance(id);
    validationCache.set(key, { timestamp: now, data });
    return data;
  }, []);

  // Validación combinada para reducir llamadas
  const validateAll = useCallback(async (id: string, apt: string): Promise<ValidationResponse | null> => {
    if (!id.trim() || !apt.trim() || id.length < 3 || apt.length < 1) {
      return null;
    }

    // Evitar validaciones muy frecuentes
    const now = Date.now();
    if (now - lastValidationTime.current < 2000) { // 2 segundos mínimo entre validaciones
      return null;
    }
    lastValidationTime.current = now;

    try {
      const [voteStatus, validation, attendance] = await Promise.all([
        getCachedVoteStatus(id),
        getCachedValidation(id, apt),
        getCachedAttendance(id)
      ]);

      return {
        voteStatus,
        validation,
        attendance
      };
    } catch (error) {
      console.error('Validation error:', error);
      return null;
    }
  }, [getCachedVoteStatus, getCachedValidation, getCachedAttendance]);

  // Efecto unificado para todas las validaciones
  useEffect(() => {
    let isActive = true;

    const performValidation = async () => {
      const result = await validateAll(debouncedVoterId, debouncedApartment);

      if (!isActive || !result) return;

      const { voteStatus, validation, attendance } = result;

      setHasVoted(voteStatus);
      setIsAttendanceEnabled(attendance?.enabled ?? false);

      if (validation.valid) {
        const weight = voterWeights[debouncedApartment];
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
    };

    performValidation();

    return () => {
      isActive = false;
    };
  }, [debouncedVoterId, debouncedApartment, validateAll, voterWeights]);

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

    // Validación final antes de enviar
    const finalValidation = await validateAll(voterId, apartment);
    if (!finalValidation) {
      toast({
        title: "Error",
        description: "Por favor, verifique los datos ingresados",
        variant: "destructive"
      });
      return;
    }

    const { voteStatus, validation, attendance } = finalValidation;

    if (!validation.valid || voteStatus || !attendance?.enabled || !selectedVote) {
      toast({
        title: "Error",
        description: "No se puede proceder con el voto. Verifique sus datos.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addVote(voterId, apartment, selectedVote);

      // Actualizar el caché después de votar
      validationCache.set(`vote-${voterId}`, {
        timestamp: Date.now(),
        data: true
      });

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

            {/* Voter ID Input */}
            <div className="space-y-2">
              <Label htmlFor="voterId">Número de Cédula</Label>
              <div>
                <Input
                  id="voterId"
                  type="text"
                  value={voterId}
                  onChange={(e) => setVoterId(e.target.value)}
                  placeholder="Ingrese su número de cédula"
                  disabled={isSubmitting || checkingVote}
                  required
                  className={voterId.trim() ? (validationState.voterId?.isValid ? "border-green-500" : "border-red-500") : ""}
                />
                {voterId.trim() && (
                  <div className="mt-2 flex items-center text-sm">
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
              <div>
                <Input
                  id="apartment"
                  type="text"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  placeholder="Ingrese su número de apartamento"
                  disabled={isSubmitting || checkingVote}
                  required
                  className={apartment.trim() ? (validationState.apartment?.isValid ? "border-green-500" : "border-red-500") : ""}
                />
                {apartment.trim() && (
                  <div className="mt-2 flex items-center text-sm">
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
