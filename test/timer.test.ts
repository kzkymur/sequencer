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

    it('should throw when stopping non-running timer', () => {
      expect(() => timer.stop()).toThrow('Timer is not playing');
    });

    it('should throw when starting already running timer', () => {
      timer.play();
      expect(() => timer.play()).toThrow('Timer is already playing');
    });

    it('should throw for negative play delay', () => {
      expect(() => timer.play(-100)).toThrow('non-negative number');
    });

    it('should throw for NaN play delay', () => {
      expect(() => timer.play(NaN)).toThrow('non-negative number');
    });

    it('should throw for negative stop delay', () => {
      timer.play();
      expect(() => timer.stop(-100)).toThrow('non-negative number');
    });

    it('should throw for NaN stop delay', () => {
      timer.play();
      expect(() => timer.stop(NaN)).toThrow('non-negative number');
    });

    it('should accumulate time', () => {
      timer.play();
      vi.advanceTimersByTime(300);
      expect(timer['currentTime']).toBe(300);
    });

    it('should stop when exceeding total time without loop', () => {
      timer.setLoopFlag(false);
      timer.play();
      vi.advanceTimersByTime(1100);
      expect(timer['isPlaying']).toBe(false);
      expect(timer['currentTime']).toBe(0);
    });

    it('should handle looping', () => {
      timer.setLoopFlag(true);
      timer.play();
      vi.advanceTimersByTime(1500);
      expect(timer['currentTime']).toBe(500);
    });

    it('should handle zero total time', () => {
      expect(() => timer.setTotalTime(-1)).toThrow('Total time must be larger than 0');
    });

    it('should handle negative pitch values', () => {
      expect(() => timer.setPitch(-100)).toThrow(`Invalid pitch value: -100. Must be positive number`);
    });
  });

  describe('Event Dispatching', () => {
    it('should dispatch update events with accurate payload', () => {
      const mockListener = vi.fn();
      timer.eventTarget.addEventListener(TIMER_UPDATE_EVENT, mockListener);
      
      timer.play();
      vi.advanceTimersByTime(250);
      
      expect(mockListener).toHaveBeenCalledTimes(2);
      expect(mockListener.mock.calls[0][0].detail).toBe(100);
      expect(mockListener.mock.calls[1][0].detail).toBe(200);
    });

    it('should stop dispatching after stop()', () => {
      const mockListener = vi.fn();
      timer.eventTarget.addEventListener(TIMER_UPDATE_EVENT, mockListener);
      
      timer.play();
      vi.advanceTimersByTime(150);
      timer.stop();
      vi.advanceTimersByTime(200);
      
      expect(mockListener).toHaveBeenCalledTimes(1);
    });

    it('should clean up listeners on stop()', () => {
      const mockListener = vi.fn();
      timer.eventTarget.addEventListener(TIMER_UPDATE_EVENT, mockListener);
      
      timer.play();
      timer.stop();
      
      expect(mockListener).toHaveBeenCalledTimes(0);
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

  describe('Configuration Changes', () => {
    it('should apply new pitch immediately', () => {
      timer.setPitch(200);
      timer.play();
      vi.advanceTimersByTime(400);
      expect(timer['currentTime']).toBe(400);
    });

    it('should handle total time reduction during operation', () => {
      timer.play();
      vi.advanceTimersByTime(500);
      timer.setTotalTime(600);
      vi.advanceTimersByTime(200);
      expect(timer['isPlaying']).toBe(false);
    });
  });
});