import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Circle, AlertCircle } from "lucide-react";
import { VoteData, VoterWeights, VotingState } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";
import { checkIfVoted } from "@/services/firebaseService";

interface VotingFormProps {
  onVote: (voterId: string, vote: 'si' | 'no' | 'blanco') => void;
  voterWeights: VoterWeights;
  existingVotes: VoteData[];
  votingState: VotingState;
}

const VotingForm = ({ onVote, voterWeights, existingVotes, votingState }: VotingFormProps) => {
  const [voterId, setVoterId] = useState("");
  const [selectedVote, setSelectedVote] = useState<'si' | 'no' | 'blanco' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [checkingVote, setCheckingVote] = useState(false);
  const { toast } = useToast();

  // Verificar si el ID ya votó en Firebase
  useEffect(() => {
    const checkVoteStatus = async () => {
      if (voterId && voterId in voterWeights) {
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
  }, [voterId, voterWeights]);

  const validateVoterId = (id: string) => {
    if (!id.trim()) {
      return "El ID es obligatorio";
    }
    
    if (!(id in voterWeights)) {
      return "ID no encontrado en la base de datos";
    }
    
    if (hasVoted) {
      return "Este ID ya ha votado";
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

    const validationError = validateVoterId(voterId);
    if (validationError) {
      toast({
        title: "Error",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onVote(voterId, selectedVote);
      
      toast({
        title: "¡Voto registrado!",
        description: `Voto "${selectedVote.toUpperCase()}" registrado correctamente para ID: ${voterId}`,
      });
      
      setVoterId("");
      setSelectedVote(null);
      setHasVoted(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al registrar el voto",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const voterWeight = voterId && voterWeights[voterId] ? voterWeights[voterId] : null;
  const validationError = voterId ? validateVoterId(voterId) : null;

  if (!votingState.isActive || !votingState.question) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Votación No Disponible</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
            <AlertCircle size={48} />
          </div>
          <p className="text-lg text-gray-600 mb-4">
            La votación no está activa en este momento.
          </p>
          <p className="text-sm text-gray-500">
            Por favor, espere a que el administrador inicie la votación.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Emitir Voto</CardTitle>
        <div className="space-y-2">
          <p className="text-lg font-semibold">
            {votingState.question.title}
          </p>
          {votingState.question.description && (
            <p className="text-gray-600">
              {votingState.question.description}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ID Input */}
          <div className="space-y-2">
            <Label htmlFor="voterId" className="text-base font-medium">
              ID del Votante *
            </Label>
            <Input
              id="voterId"
              type="text"
              value={voterId}
              onChange={(e) => setVoterId(e.target.value.trim())}
              placeholder="Ingrese su ID"
              className="text-lg p-3"
              disabled={isSubmitting}
            />
            
            {/* Feedback del ID */}
            {voterId && (
              <div className="flex items-center gap-2 text-sm">
                {checkingVote ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-blue-600">Verificando...</span>
                  </>
                ) : validationError ? (
                  <>
                    <XCircle className="text-red-500" size={16} />
                    <span className="text-red-600">{validationError}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="text-green-500" size={16} />
                    <span className="text-green-600">
                      ID válido - Peso del voto: {voterWeight}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Opciones de Voto */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Seleccione su voto:</Label>
            
            <div className="grid grid-cols-1 gap-3">
              {/* Opción SÍ */}
              <Button
                type="button"
                variant={selectedVote === 'si' ? 'default' : 'outline'}
                className="h-16 text-lg justify-start bg-green-50 hover:bg-green-100 border-green-200"
                onClick={() => setSelectedVote('si')}
                disabled={isSubmitting}
              >
                <CheckCircle className="mr-3 text-green-600" size={24} />
                SÍ - A favor de la propuesta
              </Button>

              {/* Opción NO */}
              <Button
                type="button"
                variant={selectedVote === 'no' ? 'default' : 'outline'}
                className="h-16 text-lg justify-start bg-red-50 hover:bg-red-100 border-red-200"
                onClick={() => setSelectedVote('no')}
                disabled={isSubmitting}
              >
                <XCircle className="mr-3 text-red-600" size={24} />
                NO - En contra de la propuesta
              </Button>

              {/* Opción EN BLANCO */}
              <Button
                type="button"
                variant={selectedVote === 'blanco' ? 'default' : 'outline'}
                className="h-16 text-lg justify-start bg-gray-50 hover:bg-gray-100 border-gray-200"
                onClick={() => setSelectedVote('blanco')}
                disabled={isSubmitting}
              >
                <Circle className="mr-3 text-gray-600" size={24} />
                EN BLANCO - Abstención
              </Button>
            </div>
          </div>

          {/* Botón de Envío */}
          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={!voterId || !selectedVote || !!validationError || isSubmitting || checkingVote}
          >
            {isSubmitting ? "Registrando voto..." : "CONFIRMAR VOTO"}
          </Button>

          {/* Advertencia */}
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
