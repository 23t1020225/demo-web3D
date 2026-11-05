// Keep the floor's appearance constant; only the capture frequency changes.
export function refreshReflection(changed, moving, elapsed) {
  return changed && (!moving || elapsed >= 100)
}
