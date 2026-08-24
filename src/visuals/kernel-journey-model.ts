// SPDX-License-Identifier: Apache-2.0

export const KERNEL_JOURNEY_STAGES = [
  { id: 'launch' },
  { id: 'grid-ready' },
  { id: 'block-scheduled' },
  { id: 'warps-formed' },
  { id: 'warp-issued' },
  { id: 'memory-transactions' },
  { id: 'block-complete' },
  { id: 'synchronization-complete' },
] as const;

export type KernelJourneyStageId = (typeof KERNEL_JOURNEY_STAGES)[number]['id'];

export type KernelJourneyState = Readonly<{
  stageIndex: number;
  isPlaying: boolean;
}>;

export type KernelJourneyAction =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'step' }
  | { type: 'tick' }
  | { type: 'scrub'; stageIndex: number }
  | { type: 'reset' };

const finalStageIndex = KERNEL_JOURNEY_STAGES.length - 1;

export function createKernelJourneyState(): KernelJourneyState {
  return { stageIndex: 0, isPlaying: false };
}

export function reduceKernelJourney(
  state: KernelJourneyState,
  action: KernelJourneyAction,
): KernelJourneyState {
  switch (action.type) {
    case 'play':
      return state.stageIndex === finalStageIndex || state.isPlaying ? state : { ...state, isPlaying: true };
    case 'pause':
      return state.isPlaying ? { ...state, isPlaying: false } : state;
    case 'step': {
      if (state.stageIndex === finalStageIndex) return { ...state, isPlaying: false };
      return { stageIndex: state.stageIndex + 1, isPlaying: false };
    }
    case 'tick': {
      if (!state.isPlaying) return state;
      const stageIndex = Math.min(state.stageIndex + 1, finalStageIndex);
      return { stageIndex, isPlaying: stageIndex !== finalStageIndex };
    }
    case 'scrub':
      if (
        !Number.isInteger(action.stageIndex) ||
        action.stageIndex < 0 ||
        action.stageIndex > finalStageIndex
      ) {
        return state;
      }
      return { stageIndex: action.stageIndex, isPlaying: false };
    case 'reset':
      return createKernelJourneyState();
  }
}
