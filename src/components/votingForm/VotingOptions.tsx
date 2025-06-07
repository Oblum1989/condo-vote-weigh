import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface VotingOptionsProps {
  options: string[];
  selectedVote: string | null;
  isSubmitting: boolean;
  onVoteSelect: (vote: string) => void;
}

const VotingOptions = ({
  options,
  selectedVote,
  isSubmitting,
  onVoteSelect,
}: VotingOptionsProps) => {
  return (
    <div className="space-y-4">
      <Label className="text-lg font-semibold text-gray-800">Su Voto</Label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option, index) => {
          const isSelected = selectedVote === option.toLowerCase();
          return (
            <Button
              key={index}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => onVoteSelect(option.toLowerCase())}
              className={`
                h-20 relative overflow-hidden transition-all duration-200
                ${isSelected ? 'bg-blue-600 hover:bg-blue-700 shadow-lg scale-[1.02]' :
                  'hover:bg-blue-50 border-2 hover:border-blue-300'}
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              disabled={isSubmitting}
            >
              <div className="flex items-center justify-center gap-2">
                {isSelected && (
                  <Check className="w-5 h-5 mr-1 animate-in fade-in duration-200" />
                )}
                <span className={`text-xl font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                  {option.toUpperCase()}
                </span>
              </div>
              {isSelected && (
                <div className="absolute bottom-1 left-0 w-full text-sm text-blue-100">
                  Seleccionado
                </div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default VotingOptions;
