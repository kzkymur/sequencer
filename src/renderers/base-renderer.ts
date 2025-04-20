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
    this.drawTimelineBackground(ctx, options);

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
    options: RenderOptions
  ) {
    ctx.fillStyle = options.inactiveColor || '#2ed573';
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

    ctx.fillText(text, x + 16, y);
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

export const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) => {
  // 角丸の半径が四辺より大きい場合は調整
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;

  ctx.beginPath();
  ctx.moveTo(x + r, y);           // 上辺の左から
  ctx.lineTo(x + w - r, y);       // 上辺の右まで
  ctx.arcTo(x + w, y, x + w, y + r, r);         // 右上角の丸み
  ctx.lineTo(x + w, y + h - r);   // 右辺の下まで
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r); // 右下角の丸み
  ctx.lineTo(x + r, y + h);       // 下辺の左まで
  ctx.arcTo(x, y + h, x, y + h - r, r);         // 左下角の丸み
  ctx.lineTo(x, y + r);           // 左辺の上まで
  ctx.arcTo(x, y, x + r, y, r);   // 左上角の丸み
  ctx.closePath();

  ctx.fillStyle = color; // 塗りつぶし色
  ctx.fill();
}

// 角丸のフレームを描画する関数（左上座標 x, y, 幅 w, 高さ h, 角丸半径 r）
export const strokeRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, lineWidth: number, color: string) => {
  // 線のスタイルを設定（例：青色、太さ3px）
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  // 角丸の半径が四辺より大きい場合は調整
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.stroke();
}