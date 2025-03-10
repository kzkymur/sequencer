import { describe, expect, it, vi, beforeEach } from 'vitest';
import { IndependentSequencer } from '../src/sequencer';
import { IndependentFragment } from '../src/fragments';

describe('IndependentSequencer', () => {
  let sequencer: IndependentSequencer;
  const mockCallback1 = vi.fn();
  const mockCallback2 = vi.fn();
  
  beforeEach(() => {
    if (sequencer && sequencer.isPlaying()) sequencer.stop()
    sequencer = new IndependentSequencer(100, 1.0, false);
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  describe('Fragment Handling', () => {
    it('should execute overlapping fragments', () => {
      const fragment1 = new IndependentFragment('F1', 500, 0, mockCallback1);
      const fragment2 = new IndependentFragment('F2', 500, 250, mockCallback2);
      
      sequencer.push(fragment1);
      sequencer.push(fragment2);
      
      sequencer.play();
      vi.advanceTimersByTime(600)
      
      expect(mockCallback1).toHaveBeenCalledTimes(5); // 0-500ms (5x100ms intervals)
      expect(mockCallback2).toHaveBeenCalledTimes(4); // 250-750ms (4x100ms intervals)
    });

    it('should handle multiple active fragments per tick', () => {
      const fragment1 = new IndependentFragment('F1', 500, 0, mockCallback1);
      const fragment2 = new IndependentFragment('F2', 500, 0, mockCallback2);
      
      sequencer.push(fragment1);
      sequencer.push(fragment2);
      
      sequencer.play()
      vi.advanceTimersByTime(250)
      // Simulate timer advancing to 250ms
      expect(mockCallback1).toHaveBeenCalledTimes(3);
      expect(mockCallback2).toHaveBeenCalledTimes(3);
    });
  });

  describe('Time Calculation', () => {
    it('should calculate total time correctly', () => {
      sequencer.push(new IndependentFragment('F1', 1000, 0));
      sequencer.push(new IndependentFragment('F2', 500, 1500));
      
      expect(sequencer.getTotalTime()).toBe(2000);
    });

    it('should handle empty fragments', () => {
      expect(sequencer.getTotalTime()).toBe(0);
    });
  });

  describe('Loop Behavior', () => {
    it('should reset time when looping', () => {
      sequencer.setLoopFlag(true);
      sequencer.push(new IndependentFragment('F1', 500, 0, mockCallback1));
      
      sequencer.play();
      expect(mockCallback1).toHaveBeenCalledTimes(0);
      expect(sequencer.getCurrentTime()).toBe(0);
      vi.advanceTimersByTime(100)
      expect(sequencer.getCurrentTime()).toBe(100);
      
      expect(mockCallback1).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle fragments with same start time', () => {
      const fragment1 = new IndependentFragment('F1', 200, 0, mockCallback1);
      const fragment2 = new IndependentFragment('F2', 200, 0, mockCallback2);
      
      sequencer.push(fragment1);
      sequencer.push(fragment2);
      
      sequencer.play(100);
      vi.advanceTimersByTime(100)
      expect(mockCallback1).toHaveBeenCalled();
      expect(mockCallback2).toHaveBeenCalled();
    });

    it('should handle zero-duration fragments', () => {
      const fragment = new IndependentFragment('F1', 0, 0, mockCallback1);
      sequencer.push(fragment);
      sequencer.play(0);
      expect(mockCallback1).not.toHaveBeenCalled();
    });

    it('should handle fragments outside time range', () => {
      const fragment = new IndependentFragment('F1', 100, 1000, mockCallback1);
      sequencer.push(fragment);
      sequencer.play(500);
      expect(mockCallback1).not.toHaveBeenCalled();
    });
  });
  
  it('should throw when trying to insert fragments', () => {
    const frag = new IndependentFragment('Test', 100, 0);
    expect(() => sequencer.insert(0, frag))
      .toThrow('Insert operation not supported');
  });
});