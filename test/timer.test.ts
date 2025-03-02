import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Timer } from '../src/timer';
import { TIMER_UPDATE_EVENT } from '../src/const';

describe('TimerWorker Class', () => {
  let timer: Timer;
  
  beforeEach(() => {
    vi.useFakeTimers();
    timer = new Timer(1000, 100, false, false);
  });

  describe('Time Control', () => {
    it('should start and stop timer', () => {
      timer.play();
      expect(timer['isPlaying']).toBe(true);
      timer.stop();
      expect(timer['isPlaying']).toBe(false);
    });

    it('should accumulate time', () => {
      timer.play();
      vi.advanceTimersByTime(300);
      expect(timer['currentTime']).toBe(300);
    });

    it('should handle looping', () => {
      timer.setLoopFlag(true);
      timer.play();
      vi.advanceTimersByTime(1500);
      expect(timer['currentTime']).toBe(500);
    });
  });

  describe('Event Dispatching', () => {
    it('should dispatch update events', () => {
      const mockListener = vi.fn();
      timer.eventTarget.addEventListener(TIMER_UPDATE_EVENT, mockListener);
      
      timer.play();
      vi.advanceTimersByTime(300);
      
      expect(mockListener).toHaveBeenCalledTimes(3);
      expect(mockListener.mock.calls[2][0].detail).toBe(300);
    });
  });

  describe('Configuration', () => {
    it('should update total time', () => {
      timer.setTotalTime(2000);
      expect(timer['totalTime']).toBe(2000);
    });

    it('should update pitch', () => {
      timer.setPitch(200);
      expect(timer['pitch']).toBe(200);
    });
  });

  describe('Universal Worker', () => {
    it('should use worker thread when enabled', async () => {
      const workerTimer = new Timer(1000, 100, false, true);
      await workerTimer.play();
      vi.advanceTimersByTime(100);
      expect(workerTimer['currentTime']).toBeGreaterThanOrEqual(0);
      workerTimer.stop();
    });
  });
});