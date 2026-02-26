import { Entity } from './types';

export type AnimationMode = 'idle' | 'walk' | 'run';
export type Facing8 = NonNullable<Entity['facing']>;

export interface SpriteCell {
  col: number;
  row: number;
}

export interface CharacterPose {
  mode: AnimationMode;
  bob: number;
  sway: number;
  torsoTilt: number;
  torsoLeanY: number;
  shoulderOffsetX: number;
  hipOffsetX: number;
  leftArmAngle: number;
  rightArmAngle: number;
  leftLegLift: number;
  rightLegLift: number;
  armSwing: number; // legacy aggregate, kept for compatibility
  legLift: number; // legacy aggregate, kept for compatibility
  strideCompressX: number;
  bodyScaleX: number;
  headOffsetX: number;
  headOffsetY: number;
}

export function getAnimationMode(entity: Entity): AnimationMode {
  return entity.isMoving ? 'walk' : 'idle';
}

export function getDirectionalSpriteCell(facing: Entity['facing']): SpriteCell {
  const resolvedFacing = facing || 's';

  if (['s', 'se', 'sw'].includes(resolvedFacing)) {
    return { col: 0, row: 0 }; // Front
  }
  if (['n', 'ne', 'nw'].includes(resolvedFacing)) {
    return { col: 1, row: 0 }; // Back
  }
  if (resolvedFacing === 'w') {
    return { col: 0, row: 1 }; // Left
  }
  return { col: 1, row: 1 }; // Right
}

type FacingGroup = 'front' | 'back' | 'side' | 'diagonal';

interface FacingMotionProfile {
  group: FacingGroup;
  bodyScaleX: number;
  idleBob: number;
  idleSway: number;
  idleTorsoTilt: number;
  walkBob: number;
  walkSway: number;
  walkTorsoTilt: number;
  walkArmAmp: number;
  walkLegAmp: number;
  idleArmBase: number;
  strideCompressX: number;
  shoulderOffsetX: number;
  headOffsetX: number;
}

interface IdleKeyframe {
  breathe: number;
  sway: number;
  headYaw: number;
  headBob: number;
  shoulderBias: number;
  armBias: number;
  hipShift: number;
  torsoLean: number;
}

const HEAVY_IDLE_KEYFRAMES: IdleKeyframe[] = [
  { breathe: 0.0, sway: 0.0, headYaw: 0.0, headBob: 0.0, shoulderBias: 0.0, armBias: 0.0, hipShift: 0.0, torsoLean: 0.0 },
  { breathe: 0.2, sway: 0.14, headYaw: 0.04, headBob: 0.05, shoulderBias: 0.12, armBias: 0.07, hipShift: 0.08, torsoLean: 0.03 },
  { breathe: 0.45, sway: 0.24, headYaw: 0.11, headBob: 0.1, shoulderBias: 0.2, armBias: 0.12, hipShift: 0.14, torsoLean: 0.07 },
  { breathe: 0.7, sway: 0.18, headYaw: 0.16, headBob: 0.16, shoulderBias: 0.26, armBias: 0.18, hipShift: 0.1, torsoLean: 0.1 },
  { breathe: 1.0, sway: 0.02, headYaw: 0.08, headBob: 0.26, shoulderBias: 0.36, armBias: 0.25, hipShift: 0.03, torsoLean: 0.14 },
  { breathe: 0.72, sway: -0.08, headYaw: -0.03, headBob: 0.14, shoulderBias: 0.14, armBias: 0.07, hipShift: -0.06, torsoLean: 0.04 },
  { breathe: 0.32, sway: -0.2, headYaw: -0.14, headBob: 0.02, shoulderBias: -0.12, armBias: -0.08, hipShift: -0.14, torsoLean: -0.04 },
  { breathe: 0.12, sway: -0.32, headYaw: -0.23, headBob: -0.01, shoulderBias: -0.26, armBias: -0.18, hipShift: -0.2, torsoLean: -0.1 },
  { breathe: 0.3, sway: -0.22, headYaw: -0.17, headBob: 0.03, shoulderBias: -0.18, armBias: -0.12, hipShift: -0.12, torsoLean: -0.06 },
  { breathe: 0.52, sway: -0.06, headYaw: -0.05, headBob: 0.08, shoulderBias: -0.05, armBias: -0.02, hipShift: -0.03, torsoLean: 0.0 },
  { breathe: 0.34, sway: 0.06, headYaw: 0.02, headBob: 0.04, shoulderBias: 0.04, armBias: 0.02, hipShift: 0.03, torsoLean: 0.02 },
  { breathe: 0.1, sway: 0.02, headYaw: 0.0, headBob: 0.01, shoulderBias: 0.0, armBias: 0.0, hipShift: 0.0, torsoLean: 0.0 },
];

function getFacingMotionProfile(facing: Entity['facing']): FacingMotionProfile {
  const dir = (facing || 's') as Facing8;

  if (dir === 's') {
    return {
      group: 'front',
      bodyScaleX: 1.0,
      idleBob: 0.45,
      idleSway: 0.08,
      idleTorsoTilt: 0.01,
      walkBob: 1.4,
      walkSway: 0.5,
      walkTorsoTilt: 0.025,
      walkArmAmp: 0.28,
      walkLegAmp: 1.3,
      idleArmBase: 0.08,
      strideCompressX: 1.0,
      shoulderOffsetX: 0,
      headOffsetX: 0,
    };
  }

  if (dir === 'n') {
    return {
      group: 'back',
      bodyScaleX: 0.95,
      idleBob: 0.35,
      idleSway: 0.06,
      idleTorsoTilt: 0.008,
      walkBob: 1.1,
      walkSway: 0.35,
      walkTorsoTilt: 0.02,
      walkArmAmp: 0.22,
      walkLegAmp: 1.0,
      idleArmBase: 0.06,
      strideCompressX: 0.95,
      shoulderOffsetX: 0,
      headOffsetX: 0,
    };
  }

  if (dir === 'e' || dir === 'w') {
    return {
      group: 'side',
      bodyScaleX: 0.88,
      idleBob: 0.35,
      idleSway: 0.12,
      idleTorsoTilt: 0.012,
      walkBob: 1.6,
      walkSway: 0.75,
      walkTorsoTilt: 0.03,
      walkArmAmp: 0.33,
      walkLegAmp: 1.8,
      idleArmBase: 0.12,
      strideCompressX: 0.8,
      shoulderOffsetX: 0.8,
      headOffsetX: 0.8,
    };
  }

  return {
    group: 'diagonal',
    bodyScaleX: 0.93,
    idleBob: 0.4,
    idleSway: 0.1,
    idleTorsoTilt: 0.012,
    walkBob: 1.5,
    walkSway: 0.65,
    walkTorsoTilt: 0.028,
    walkArmAmp: 0.3,
    walkLegAmp: 1.55,
    idleArmBase: 0.1,
    strideCompressX: 0.88,
    shoulderOffsetX: 0.6,
    headOffsetX: 0.5,
  };
}

function steppedPhase(timeSeconds: number, fps: number, frames: number): number {
  const frame = Math.floor(timeSeconds * fps) % frames;
  return (frame / frames) * Math.PI * 2;
}

function getSteppedFrameIndex(timeSeconds: number, fps: number, frames: number): number {
  return Math.floor(timeSeconds * fps) % frames;
}

export function getPlayerPose(
  entity: Entity,
  timeSeconds: number,
  modeOverride?: AnimationMode,
): CharacterPose {
  const mode = modeOverride || getAnimationMode(entity);
  const profile = getFacingMotionProfile(entity.facing);

  if (mode === 'walk') {
    // Fallout-style sprite motion reads better with stepped timing than smooth sine motion.
    const phase = steppedPhase(timeSeconds, 10, 6);
    const gait = Math.sin(phase);
    const counter = Math.sin(phase + Math.PI);
    return {
      mode,
      bob: Math.abs(gait) * profile.walkBob,
      sway: Math.cos(phase) * profile.walkSway,
      torsoTilt: Math.sin(phase) * profile.walkTorsoTilt,
      torsoLeanY: gait > 0 ? -0.3 : -0.1,
      shoulderOffsetX: profile.shoulderOffsetX,
      hipOffsetX: profile.shoulderOffsetX * 0.5,
      leftArmAngle: profile.idleArmBase + gait * profile.walkArmAmp,
      rightArmAngle: -profile.idleArmBase + counter * profile.walkArmAmp,
      leftLegLift: Math.max(0, counter) * profile.walkLegAmp,
      rightLegLift: Math.max(0, gait) * profile.walkLegAmp,
      armSwing: gait * profile.walkArmAmp,
      legLift: gait * profile.walkLegAmp,
      strideCompressX: profile.strideCompressX,
      bodyScaleX: profile.bodyScaleX,
      headOffsetX: profile.headOffsetX,
      headOffsetY: Math.abs(Math.cos(phase)) * 0.35,
    };
  }

  if (mode === 'run') {
    const phase = steppedPhase(timeSeconds, 14, 6);
    const gait = Math.sin(phase);
    const counter = Math.sin(phase + Math.PI);
    return {
      mode,
      bob: Math.abs(gait) * (profile.walkBob + 0.8),
      sway: Math.cos(phase) * (profile.walkSway + 0.6),
      torsoTilt: Math.sin(phase) * (profile.walkTorsoTilt + 0.03),
      torsoLeanY: -0.8,
      shoulderOffsetX: profile.shoulderOffsetX + 0.4,
      hipOffsetX: profile.shoulderOffsetX * 0.6,
      leftArmAngle: 0.15 + gait * (profile.walkArmAmp + 0.35),
      rightArmAngle: -0.15 + counter * (profile.walkArmAmp + 0.35),
      leftLegLift: Math.max(0, counter) * (profile.walkLegAmp + 1.0),
      rightLegLift: Math.max(0, gait) * (profile.walkLegAmp + 1.0),
      armSwing: gait * (profile.walkArmAmp + 0.35),
      legLift: gait * (profile.walkLegAmp + 1.0),
      strideCompressX: Math.max(0.72, profile.strideCompressX - 0.06),
      bodyScaleX: profile.bodyScaleX,
      headOffsetX: profile.headOffsetX + 0.2,
      headOffsetY: Math.abs(Math.cos(phase)) * 0.5,
    };
  }

  const idleFrame = getSteppedFrameIndex(timeSeconds, 5, HEAVY_IDLE_KEYFRAMES.length);
  const kf = HEAVY_IDLE_KEYFRAMES[idleFrame];
  const sideSign = entity.facing === 'e' || entity.facing === 'ne' || entity.facing === 'se' ? 1 : -1;
  const directionalHeadX = profile.group === 'front' || profile.group === 'back' ? 0.35 : 0.8;
  const armSpread = profile.group === 'side' ? 0.18 : profile.group === 'diagonal' ? 0.14 : 0.08;
  const hipSwing = profile.group === 'front' ? 0.8 : profile.group === 'back' ? 0.55 : 1.1;
  return {
    mode,
    bob: kf.breathe * profile.idleBob,
    sway: kf.sway * profile.idleSway * 2.2,
    torsoTilt: (kf.sway * profile.idleTorsoTilt) + (kf.torsoLean * 0.02 * sideSign),
    torsoLeanY: -kf.breathe * 0.25 + kf.torsoLean * 0.8,
    shoulderOffsetX: profile.shoulderOffsetX * 0.55 + (kf.shoulderBias * armSpread),
    hipOffsetX: profile.shoulderOffsetX * 0.25 + (kf.hipShift * hipSwing),
    leftArmAngle: profile.idleArmBase + (kf.armBias * 0.18) + (kf.shoulderBias * 0.06),
    rightArmAngle: -profile.idleArmBase + (kf.armBias * 0.1) - (kf.shoulderBias * 0.08),
    leftLegLift: Math.max(0, -kf.hipShift) * 0.5,
    rightLegLift: Math.max(0, kf.hipShift) * 0.5,
    armSwing: profile.idleArmBase + (kf.armBias * 0.07),
    legLift: 0,
    strideCompressX: profile.strideCompressX,
    bodyScaleX: profile.bodyScaleX,
    headOffsetX: profile.headOffsetX + (kf.headYaw * directionalHeadX * sideSign),
    headOffsetY: (kf.headBob * 0.9) - (kf.breathe * 0.12),
  };
}
