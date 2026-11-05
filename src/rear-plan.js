// Physical clearances in metres. Fixture dimensions remain unchanged.
export const rearPlan = {
  entryRecess: .30,
  left: -2.61,
  right: .50,
  front: -5.95,
  back: -7.86,
}

export const rearWidth = rearPlan.right - rearPlan.left
export const rearDepth = rearPlan.front - rearPlan.back
export const rearCenter = [(rearPlan.left + rearPlan.right) / 2, (rearPlan.front + rearPlan.back) / 2]

// Reposition anchors along the enlarged room without stretching doors or furniture.
export function rearZ(z) {
  return z >= rearPlan.front ? z : rearPlan.front + (z - rearPlan.front) * rearDepth / 1.61
}

export const rearDoorCenters = [rearZ(-6.43), rearZ(-7.19)]
export const rearTimberZ = rearZ(-6.55)

export function rearViewPoint([x, y, z]) { return [x, y, rearZ(z)] }

export function rearItemPoint(id, point) {
  if (id === 'dish-cabinet') return point
  const [x, y, z] = point
  const onLeftPartition = (id === 'wc-doors' || id === 'rear-tube-light') && x < -2.25
  return [x - (onLeftPartition ? .25 : 0), y, rearZ(z)]
}
