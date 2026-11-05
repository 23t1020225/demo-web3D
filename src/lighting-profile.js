import { rearCenter, rearPlan } from './rear-plan.js'

// One fixed daylight exposure and white balance throughout the house.
// Room selection only moves the camera; it never changes a light.
export const lightingProfile = Object.freeze({
  exposure: .90,
  environment: .30,
  sky: '#f3f2ec',
  ground: '#c3bbad',
  ambient: .82,
  sun: '#fff5e8',
  sunlight: 1.45,
  daylight: '#f4f3ef',
  ceiling: '#fff1df',
  reflection: .14,
})

export const ceilingLights = [
  { id: 'living-left', at: [-2.04, 2.82, -.10], width: 2.7, height: 2.5, intensity: 1.35 },
  { id: 'living-right', at: [1.48, 2.82, -.10], width: 2.5, height: 2.5, intensity: 1.35 },
  { id: 'kitchen', at: [1.30, 2.82, -4.10], width: 2.5, height: 3.2, intensity: 1.35 },
  { id: 'bedroom', at: [-2.13, 2.82, -3.94], width: 2.7, height: 2.8, intensity: 1.35 },
  { id: 'rear', at: [rearCenter[0], 2.81, rearCenter[1]], width: 2.7, height: 1.55, intensity: 1.35 },
]

export const windowLights = [
  { id: 'front-left', at: [-2.54, 1.85, 1.50], rotation: [0, 0, 0], width: 1.8, height: 1.35, intensity: 2.1 },
  { id: 'side-right', at: [2.82, 1.85, -.10], rotation: [0, Math.PI / 2, 0], width: 1.8, height: 1.35, intensity: 2.1 },
  { id: 'kitchen-side', at: [2.82, 1.85, -4.82], rotation: [0, Math.PI / 2, 0], width: .85, height: 1.25, intensity: 2.1 },
  { id: 'rear-window', at: [-.22, 1.50, rearPlan.back + .12], rotation: [0, Math.PI, 0], width: .44, height: .68, intensity: 2.1 },
]

// Broad fixed panels preserve the neutral daylight balance with three area lights.
// They replace five separate ceiling fills and four small window fills in Balanced mode.
export const balancedLightPanels = [
  { id: 'ceiling-left', at: [-2.08, 2.82, -3.20], rotation: [-Math.PI / 2, 0, 0], width: 2.7, height: 8.8, intensity: 1.05, color: lightingProfile.ceiling },
  { id: 'ceiling-right', at: [1.37, 2.82, -2.575], rotation: [-Math.PI / 2, 0, 0], width: 2.5, height: 7.55, intensity: 1.02, color: lightingProfile.ceiling },
  { id: 'daylight-fill', at: [3.05, 1.85, -3.20], rotation: [0, Math.PI / 2, 0], width: 8.4, height: 1.2, intensity: 1.05, color: lightingProfile.daylight },
]
