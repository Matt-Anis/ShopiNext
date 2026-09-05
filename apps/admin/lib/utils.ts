export function isUniqueViolation(error: unknown) {
  const cause = error instanceof Error ? error.cause : undefined
  return cause instanceof Error && "code" in cause && cause.code === "23505"
}
