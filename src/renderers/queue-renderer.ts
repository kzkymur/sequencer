import { BaseSequencerRenderer } from './base-renderer';
import type { RenderOptions } from './base-renderer';
import { Fragment } from '../fragments';

export class QueueRenderer extends BaseSequencerRenderer {
  protected layoutFragments(
    ctx: CanvasRenderingContext2D,
    fragments: Fragment[],
    totalDuration: number,
    currentTime: number,
    width: number,
    height: number,
    options: RenderOptions
  ): void {
    let accumulated = 0;
    const activeColor = options.activeColor || '#ff4757';
    const inactiveColor = options.inactiveColor || '#2ed573';

    fragments.forEach(fragment => {
      const fragmentWidth = (fragment.getDuration() / totalDuration) * width;
      const isActive = currentTime >= accumulated && 
        currentTime <= accumulated + fragment.getDuration();

      // Draw fragment background
      ctx.fillStyle = isActive ? activeColor : inactiveColor;
      ctx.fillRect(
        (accumulated / totalDuration) * width,
        height / 2 - 15,
        fragmentWidth,
        30
      );

      // Draw fragment label
      this.drawFragmentLabel(
        ctx,
        fragment,
        (accumulated / totalDuration) * width,
        height / 2,
        fragmentWidth,
      );

      accumulated += fragment.getDuration();
    });
  }
}