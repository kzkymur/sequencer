import { BaseSequencerRenderer, RenderOptions } from './base-renderer';
import { CustomFragment, IndependentFragment } from '../fragments';

type Lane = {
  id: number;
  filledUpTo: number;
};

type Assignments = {
  fragment: IndependentFragment;
  laneIds: number[];
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
      ctx.fillRect(x, y + 2, fragmentWidth, laneHeight - 4);

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
      ctx.fillRect(x, y + 2, fragmentWidth, laneHeight - 4);

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
      const { lanes } = calculateLanes(frag.getFragments());

    } else {
      let laneIndex = lanes.findIndex(lane => lane.filledUpTo <= start);
      if (laneIndex === -1) {
        laneIndex = lanes.length;
        lanes.push({ id: lanes.length, filledUpTo: end });
      } else {
        lanes[laneIndex].filledUpTo = end;
      }
      assignments.push({ fragment: frag, laneIds: [lanes[laneIndex].id] });
    }
  }

  return { lanes, assignments };
}