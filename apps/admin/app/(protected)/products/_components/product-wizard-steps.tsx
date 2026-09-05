const STEP_LABELS = ["Details", "Categories & options", "Variants"]

export function ProductWizardSteps({ step }: { step: 1 | 2 | 3 }) {
  return (
    <p className="text-sm font-medium text-muted-foreground">
      Step {step} of {STEP_LABELS.length} — {STEP_LABELS[step - 1]}
    </p>
  )
}
