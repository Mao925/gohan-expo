function OnboardingIndicators({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-2 rounded-full transition-all ${
            index === currentStep ? "w-8 bg-primary" : "w-2 bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default OnboardingIndicators;
