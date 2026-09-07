export function isUniqueViolation(error: unknown) {
  const cause = error instanceof Error ? error.cause : undefined
  return cause instanceof Error && "code" in cause && cause.code === "23505"
}

export function uniqueViolationConstraint(error: unknown) {
  const cause = error instanceof Error ? error.cause : undefined
  if (cause instanceof Error && "constraint" in cause) {
    return cause.constraint as string
  }
  return undefined
}
