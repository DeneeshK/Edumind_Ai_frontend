import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import EvaluationQuiz from "./EvaluationQuiz";

export default function EvaluationModal({
  isOpen,
  onClose,
  onSkip,
  onStart,
  onSubmitAnswer,
  sessionData,
  currentQuestion,
  questionNumber,
  totalQuestions,
  probeReason,
  finalReport,
  isSubmitting,
  isLoading,
  submitError
}) {
  if (!isOpen) return null;

  const handleStart = () => {
    onStart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-line bg-panel p-6 shadow-2xl">
        {isLoading ? (
          <div className="py-8"><LoadingSpinner label="Loading evaluation..." /></div>
        ) : finalReport || currentQuestion ? (
          <EvaluationQuiz
            sessionData={sessionData}
            currentQuestion={currentQuestion}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            probeReason={probeReason}
            finalReport={finalReport}
            onSubmitAnswer={onSubmitAnswer}
            onSkip={onSkip}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        ) : (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-bold text-slate-50">Quick Check?</h2>
            <p className="text-slate-300">
              Would you like to take a quick evaluation before moving to the next module?
            </p>
            <p className="text-sm text-slate-400">
              Evaluation helps EduMind personalize your next lessons.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button onClick={onSkip} variant="ghost">Skip evaluation</Button>
              <Button onClick={handleStart} variant="primary">Evaluate myself</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
