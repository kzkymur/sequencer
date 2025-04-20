import { BaseSequencerRenderer, RenderOptions, roundRect, strokeRoundRect } from './base-renderer';
import { CustomFragment, IndependentFragment } from '../fragments';

type Lane = {
  id: number;
  filledUpTo: number;
};

type Assignments = {
  fragment: IndependentFragment;
  lane: { index: number, size: number; };
};

export class IndependentRenderer extends BaseSequencerRenderer {
  protected layoutFragments(
    ctx: CanvasRenderingContext2D,
    fragments: IndependentFragment[],
    totalDuration: number,
    currentTime: number,
    width: number,
    height: number,
    options: RenderOptions
  ): void {
    // this.simplyLayoutFragments(
    //   ctx,
    //   fragments,
    //   totalDuration,
    //   currentTime,
    //   width,
    //   height,
    //   options
    // );

    this.LayoutFragments(
      ctx,
      fragments,
      totalDuration,
      currentTime,
      width,
      height,
      options
    )
  }

  protected simplyLayoutFragments(
    ctx: CanvasRenderingContext2D,
    fragments: IndependentFragment[],
    totalDuration: number,
    currentTime: number,
    width: number,
    height: number,
    options: RenderOptions
  ): void {
    const { lanes, assignments } = this.simplyCalculateLanes(fragments);
    const laneHeight = height / Math.max(lanes.length, 1);
    const activeColor = options.activeColor || '#ff4757';
    const inactiveColor = options.inactiveColor || '#2ed573';

    assignments.forEach(({ fragment, lane }) => {
      const start = fragment.getStartPoint();
      const duration = fragment.getDuration();
      const isActive = currentTime >= start && currentTime < start + duration;

      // Calculate fragment position
      const x = (start / totalDuration) * width;
      const fragmentWidth = (duration / totalDuration) * width;
      const y = lane * laneHeight;

      // Draw fragment background
      ctx.fillStyle = isActive ? activeColor : inactiveColor;
      ctx.fillRect(x, y, fragmentWidth, laneHeight);

      // Draw fragment label
      this.drawFragmentLabel(
        ctx,
        fragment,
        x,
        y + laneHeight / 2,
        fragmentWidth,
      );
    });
  }

  private simplyCalculateLanes(fragments: IndependentFragment[]) {
    // 1. sort by startPoint and endPoint
    // 2. create lanes[] array. Each element is the current "filled up to" of the lane.
    // 3. process fragments
    //   3.1. find a lane where "filled up to" < fragment.start from lanes[]
    //   3.2. if there is, update "filled up to"
    //   3.3  else, push fragement.end to lanes[]

    const sortedFragments = [...fragments].sort((a, b) =>
      a.getStartPoint() - b.getStartPoint() ||
      b.getDuration() - a.getDuration()
    );

    const lanes: number[] = [];
    const assignments: Array<{ fragment: IndependentFragment, lane: number }> = [];

    for (const frag of sortedFragments) {
      const start = frag.getStartPoint();
      const end = start + frag.getDuration();

      let lane = lanes.findIndex(laneEnd => laneEnd <= start);
      if (lane === -1) {
        lane = lanes.length;
        lanes.push(end);
      } else {
        lanes[lane] = end;
      }

      assignments.push({ fragment: frag, lane });
    }
    return { lanes, assignments };
  }

  protected LayoutFragments(
    ctx: CanvasRenderingContext2D,
    fragments: IndependentFragment[],
    totalDuration: number,
    currentTime: number,
    width: number,
    height: number,
    options: RenderOptions,
    offsetX: number = 0,
    offsetY: number = 0,
  ): void {
    const { lanes, assignments } = calculateLanes(fragments);
    const laneHeight = height / Math.max(lanes.length, 1);
    const activeColor = options.activeColor || '#ff4757';
    const inactiveColor = options.inactiveColor || '#2ed573';

    assignments.forEach(({ fragment, lane }) => {
      const start = fragment.getStartPoint();
      const duration = fragment.getDuration();
      const isActive = currentTime >= start && currentTime < start + duration;

      // Calculate fragment position
      const x = offsetX + (start / totalDuration) * width;
      const fragmentWidth = (duration / totalDuration) * width;
      const y = offsetY + lane.index * laneHeight;

      if (fragment instanceof CustomFragment) {
        this.LayoutFragments(
          ctx,
          fragment.getFragments(),
          fragment.getDuration(),
          currentTime - fragment.getStartPoint(),
          fragmentWidth,
          laneHeight * lane.size,
          options,
          x,
          y
        )
        strokeRoundRect(ctx, x, y, fragmentWidth, laneHeight * lane.size, 8, 2, "red");

      } else {
        roundRect(ctx, x, y + 1, fragmentWidth, laneHeight - 1, 12, isActive ? activeColor : inactiveColor);

        // Draw fragment label
        this.drawFragmentLabel(
          ctx,
          fragment,
          x,
          y + laneHeight / 4,
          fragmentWidth,
        );
      }
    });
  }
}

const calculateLanes = (fragments: IndependentFragment[]) => {
  // 1. sort by startPoint and endPoint
  // 2. create lanes[] array. Each element is the current "filled up to" of the lane.
  // 3. process fragments
  //   3.1. check the fragment is instanceof CustomFragment.
  //   3.2. if it is,
  //     3.2.1. calculate lanes
  //     3.2.2. find continuous lanes where "filled up to" < fragment.start from lanes[]
  //     3.2.2. if there are, update "filled up to"
  //     3.2.3. else, push fragement.end to lanes[]
  //   3.3. else,
  //     3.3.1. find a lane where "filled up to" < fragment.start from lanes[]
  //     3.3.2. if there is, update "filled up to"
  //     3.3.3. else, push fragement.end to lanes[]

  const sortedFragments = [...fragments].sort((a, b) =>
    a.getStartPoint() - b.getStartPoint() ||
    b.getDuration() - a.getDuration()
  );

  const lanes: Lane[] = [];
  const assignments: Assignments[] = [];

  for (const frag of sortedFragments) {
    const start = frag.getStartPoint();
    const end = start + frag.getDuration();

    if (frag instanceof CustomFragment) {
      const { lanes: childLanes } = calculateLanes(frag.getFragments());
      let laneIndex = findConsecutiveAtLeastThreshold(lanes.map(l => l.filledUpTo), start, childLanes.length)
      if (laneIndex === -1) {
        laneIndex = lanes.length;
        lanes.push(...Array.from({ length: childLanes.length }, (_, i) => ({ id: lanes.length + i, filledUpTo: end })));
      } else {
        for (let i = 0; i < childLanes.length; i++) lanes[laneIndex + i].filledUpTo = end;
      }
      assignments.push({ fragment: frag, lane: { index: laneIndex, size: childLanes.length } });
    } else {
      let laneIndex = lanes.findIndex(lane => lane.filledUpTo <= start);
      if (laneIndex === -1) {
        laneIndex = lanes.length;
        lanes.push({ id: lanes.length, filledUpTo: end });
      } else {
        lanes[laneIndex].filledUpTo = end;
      }
      assignments.push({ fragment: frag, lane: { index: laneIndex, size: 1 } });
    }
  }

  return { lanes, assignments };
}

const findConsecutiveAtLeastThreshold = (
  numbers: number[],
  threshold: number,
  requiredCount: number
): number => {
  for (let i = 0; i <= numbers.length - requiredCount; i++) {
    let allAtLeast = true;
    for (let j = 0; j < requiredCount; j++) {
      if (numbers[i + j] > threshold) {
        allAtLeast = false;
        break;
      }
    }
    if (allAtLeast) return i;
  }
  return -1;
}