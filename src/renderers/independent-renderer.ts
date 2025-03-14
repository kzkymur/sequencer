import { BaseSequencerRenderer, RenderOptions } from './base-renderer';
import { IndependentFragment } from '../fragments';

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
    const { lanes, assignments } = this.calculateLanes(fragments);
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
        y + laneHeight/2,
        fragmentWidth,
      );
    });
  }

  private calculateLanes(fragments: IndependentFragment[]) {
    const sortedFragments = [...fragments].sort((a, b) => 
      a.getStartPoint() - b.getStartPoint() || 
      b.getDuration() - a.getDuration()
    );

    const lanes: number[] = [];
    const assignments: Array<{fragment: IndependentFragment, lane: number}> = [];

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