import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

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
    <Card className="border-2 shadow-md overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          Pregunta Actual
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">
            {question.title}
          </h2>
          {question.description && (
            <p className="text-gray-600 text-lg leading-relaxed">
              {question.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentQuestion;
