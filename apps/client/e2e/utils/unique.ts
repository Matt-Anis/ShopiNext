export function uniqueSuffix() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function uniqueNameSuffix() {
  return uniqueSuffix().replace(/\d/g, (digit) =>
    String.fromCharCode(65 + Number(digit))
  )
}
