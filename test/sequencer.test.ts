import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Sequencer } from '../src/sequencer';
import { Fragment } from '../src/fragments';

describe('Sequencer Class', () => {
  let sequencer: Sequencer;
  const mockCallback = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    sequencer = new Sequencer(100, false);
    mockCallback.mockClear();
  });

  describe('Fragment Management', () => {
    it('should add fragments', () => {
      const fragment = new Fragment('Test', 1000);
      sequencer.push(fragment);
      expect(sequencer.getFragments()).toHaveLength(1);
    });

    it('should prevent duplicate fragments', () => {
      const fragment = new Fragment('Test', 1000);
      sequencer.push(fragment);
      expect(() => sequencer.push(fragment)).toThrow();
    });

    it('should remove fragments', () => {
      const fragment = new Fragment('Test', 1000);
      sequencer.push(fragment);
      sequencer.remove(fragment);
      expect(sequencer.getFragments()).toHaveLength(0);
    });
  });

  describe('Playback Control', () => {
    it('should start and stop playback', () => {
      sequencer.play();
      expect(() => sequencer.play()).toThrow();
      sequencer.stop();
      expect(() => sequencer.stop()).toThrow();
    });

    it('should execute fragment callbacks with precise timing', () => {
      const fragment1 = new Fragment('Test1', 100, mockCallback);
      const fragment2 = new Fragment('Test2', 50, mockCallback);
      sequencer.push(fragment1);
      sequencer.push(fragment2);
      sequencer.play();
      
      // Exact boundary checks
      vi.advanceTimersByTime(99);
      expect(mockCallback).toHaveBeenCalledTimes(0);
      
      vi.advanceTimersByTime(1); // 100ms
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(49); // 149ms
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(1); // 150ms
      expect(mockCallback).toHaveBeenCalledTimes(2);
      
      sequencer.stop();
    });

    it('should handle looped playback correctly', () => {
      sequencer.setLoopFlag(true);
      const fragment = new Fragment('LoopTest', 200, mockCallback);
      sequencer.push(fragment);
      sequencer.play();
      
      // First iteration
      vi.advanceTimersByTime(200);
      expect(mockCallback).toHaveBeenCalledTimes(2); // 100ms and 200ms
      
      // Second iteration
      vi.advanceTimersByTime(200);
      expect(mockCallback).toHaveBeenCalledTimes(4);
      
      // Partial third iteration
      vi.advanceTimersByTime(50);
      sequencer.stop();
      expect(mockCallback).toHaveBeenCalledTimes(4);
    });

    it('should prevent state mutations during playback', () => {
      sequencer.play();
      const fragment = new Fragment('Test', 100);
      expect(() => sequencer.push(fragment)).toThrow();
      expect(() => sequencer.setPitch(50)).toThrow();
      sequencer.stop();
    });
  });

  describe('Configuration', () => {
    it('should update pitch', () => {
      sequencer.setPitch(200);
      expect(sequencer.getPitch()).toBe(200);
    });

    it('should reject invalid pitch values', () => {
      expect(() => sequencer.setPitch(0)).toThrow();
      expect(() => sequencer.setPitch(-100)).toThrow();
      expect(() => sequencer.setPitch(NaN)).toThrow();
    });

    it('should update loop flag', () => {
      sequencer.setLoopFlag(true);
      expect(sequencer.isLooping()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid fragment operations', () => {
      const fragment = new Fragment('Test', 100);
      expect(() => sequencer.remove(fragment)).toThrow();
      expect(() => sequencer.push(null as any)).toThrow();
    });

    it('should handle extreme duration values', () => {
      const longFragment = new Fragment('Long', Number.MAX_SAFE_INTEGER);
      const shortFragment = new Fragment('Short', 0.001);
      sequencer.push(longFragment);
      sequencer.push(shortFragment);
      sequencer.play();
      
      vi.advanceTimersByTime(100);
      sequencer.stop();
    });
  });

  describe('Concurrency', () => {
    it('should handle rapid play/stop cycles', () => {
      const fragment = new Fragment('Stress', 10);
      sequencer.push(fragment);
      
      for (let i = 0; i < 10; i++) {
        sequencer.play();
        vi.advanceTimersByTime(5);
        sequencer.stop();
      }
    });

    it('should prevent callback execution after stop', () => {
      const fragment = new Fragment('Test', 50, mockCallback);
      sequencer.push(fragment);
      sequencer.play();
      vi.advanceTimersByTime(25);
      sequencer.stop();
      vi.advanceTimersByTime(50);
      expect(mockCallback).toHaveBeenCalledTimes(0);
    });
  });
});
      