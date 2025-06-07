import { Card, CardContent } from "@/components/ui/card";

interface QuestionData {
  title: string;
  description?: string;
}

interface CurrentQuestionProps {
  question: QuestionData | null;
}

const CurrentQuestion = ({ question }: CurrentQuestionProps) => {
  if (!question) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <h2 className="text-xl font-semibold">{question.title}</h2>
          {question.description && (
            <p className="text-gray-600">{question.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentQuestion;
