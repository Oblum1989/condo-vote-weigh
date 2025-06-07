import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
    <div className="space-y-2">
      <Label>Su Voto</Label>
      <div className={`grid grid-cols-${options.length} gap-4`}>
        {options.map((option, index) => (
          <Button
            key={index}
            type="button"
            variant={selectedVote === option.toLowerCase() ? 'default' : 'outline'}
            onClick={() => onVoteSelect(option.toLowerCase())}
            className="h-16"
            disabled={isSubmitting}
          >
            {option.toUpperCase()}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default VotingOptions;
