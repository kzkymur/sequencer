import { Fragment, IndependentFragment } from '../fragments';

export type RenderOptions = {
  width?: number;
  height?: number;
  activeColor?: string;
  inactiveColor?: string; 
  timeIndicatorColor?: string;
};

export abstract class BaseSequencerRenderer {
  protected abstract layoutFragments(
    ctx: CanvasRenderingContext2D,
    fragments: Fragment[],
    totalDuration: number,
    currentTime: number,
    width: number,
    height: number,
    options: RenderOptions
  ): void;

  render(
    ctx: CanvasRenderingContext2D,
    fragments: Fragment[],
    totalDuration: number,
    currentTime: number,
    options: RenderOptions
  ) {
    const { width, height } = this.getDimensions(ctx, options);
    this.clearCanvas(ctx, width, height);
    this.drawTimelineBackground(ctx, width, height, options);
    
    this.layoutFragments(ctx, fragments, totalDuration, currentTime, width, height, options);
    this.drawTimeIndicator(ctx, currentTime, totalDuration, width, height, options);
  }

  protected getDimensions(ctx: CanvasRenderingContext2D, options: RenderOptions) {
    return {
      width: options.width || ctx.canvas.width,
      height: options.height || ctx.canvas.height
    };
  }

  protected clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.clearRect(0, 0, width, height);
  }

  protected drawTimelineBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: RenderOptions
  ) {
    ctx.fillStyle = options.inactiveColor || '#2ed573';
    ctx.fillRect(0, height / 2 - 2, width, 4);
  }

  protected drawTimeIndicator(
    ctx: CanvasRenderingContext2D,
    currentTime: number,
    totalDuration: number,
    width: number,
    height: number,
    options: RenderOptions
  ) {
    // Draw current time indicator
    ctx.fillStyle = options.timeIndicatorColor || "#ffa502";
    const indicatorX = (currentTime / totalDuration) * width;
    ctx.beginPath();
    ctx.moveTo(indicatorX, 0);
    ctx.lineTo(indicatorX, height);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  protected drawFragmentLabel(
    ctx: CanvasRenderingContext2D,
    fragment: Fragment | IndependentFragment,
    x: number,
    y: number,
    width: number,
  ) {
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '12px Arial';
    
    const maxWidth = width - 8;
    const text = this.ellipsizeText(ctx, fragment.getName(), maxWidth);
    
    ctx.fillText(text, x + width/2, y);
  }

  private ellipsizeText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    const metrics = ctx.measureText(text);
    if (metrics.width <= maxWidth) return text;
    
    let ellipsized = text;
    while (ellipsized.length > 3) {
      ellipsized = ellipsized.slice(0, -1);
      const metrics = ctx.measureText(ellipsized + '...');
      if (metrics.width <= maxWidth) return ellipsized + '...';
    }
    return '...';
  }
}