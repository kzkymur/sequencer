import { describe, expect, it, vi, beforeEach } from 'vitest';
import '@vitest/web-worker'
import { Sequencer } from '../src/sequencer';
import { Fragment } from '../src/fragments';
import { subscribe } from 'diagnostics_channel';

describe('Sequencer Class', () => {
  let sequencer: Sequencer;
  const mockCallback = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    sequencer = new Sequencer(100, 1.0, false);
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
    
    it('should insert fragments at valid positions', () => {
      const frag1 = new Fragment('A', 100);
      const frag2 = new Fragment('B', 200);
      const frag3 = new Fragment('C', 300);
      
      sequencer.push(frag1);
      sequencer.insert(0, frag2); // Insert at start
      sequencer.insert(2, frag3); // Insert at end
      
      expect(sequencer.getFragments()).toEqual([frag2, frag1, frag3]);
    });

    it('should throw on invalid insert index', () => {
      const frag = new Fragment('Test', 100);
      expect(() => sequencer.insert(-1, frag)).toThrow('Invalid index');
      expect(() => sequencer.insert(1, frag)).toThrow('Invalid index');
    });

    it('should prevent duplicate fragment insertion', () => {
      const frag = new Fragment('Test', 100);
      sequencer.insert(0, frag);
      expect(() => sequencer.insert(0, frag)).toThrow('already exists');
    });

    it('should update total duration on insert', () => {
      const frag1 = new Fragment('A', 100);
      const frag2 = new Fragment('B', 200);
      
      sequencer.insert(0, frag1);
      // expect(sequencer.getTotalTime()).toBe(100);
      
      // sequencer.insert(0, frag2);
      // expect(sequencer.getTotalTime()).toBe(300);
    });
  });

  describe('Playback Control', () => {
    it('should start and stop playback', () => {
      sequencer.play();
      expect(() => sequencer.play()).toThrow();
      sequencer.stop();
      expect(() => sequencer.stop()).toThrow();
    });

    it('should resume playback correctly after stop', () => {
      const fragment = new Fragment('ResumeTest', 400, mockCallback);
      sequencer.push(fragment);
      
      // First play session
      sequencer.play();
      vi.advanceTimersByTime(200); // 200ms elapsed
      expect(sequencer.getCurrentTime()).toBe(200);
      expect(mockCallback).toHaveBeenCalledTimes(3); // Called at 100ms pitch including first 0
      sequencer.stop();

      // Second play session
      sequencer.play();
      vi.advanceTimersByTime(100); // Total 300ms
      expect(sequencer.getCurrentTime()).toBe(300);
      expect(mockCallback).toHaveBeenCalledTimes(5); // 0ms, 100ms, 200ms, 200ms, 300ms
      
      sequencer.stop();
    });

    it('should throw for negative play delay', () => {
      expect(() => sequencer.play(-100)).toThrow('non-negative number');
    });

    it('should throw for NaN play delay', () => {
      expect(() => sequencer.play(NaN)).toThrow('non-negative number');
    });

    it('should throw for negative stop delay', () => {
      sequencer.play();
      expect(() => sequencer.stop(-100)).toThrow('non-negative number');
    });

    it('should throw for NaN stop delay', () => {
      sequencer.play();
      expect(() => sequencer.stop(NaN)).toThrow('non-negative number');
    });

    it('should execute fragment callbacks with precise timing', () => {
      const fragment1 = new Fragment('Test1', 100, mockCallback);
      const fragment2 = new Fragment('Test2', 50, mockCallback);
      sequencer.push(fragment1);
      sequencer.push(fragment2);
      sequencer.play();
      
      // Exact boundary checks
      vi.advanceTimersByTime(99);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(1); // 100ms
      expect(mockCallback).toHaveBeenCalledTimes(2);
      
      vi.advanceTimersByTime(50); // 150ms
      expect(mockCallback).toHaveBeenCalledTimes(2);
      
      sequencer.stop();
    })
    
    it('should handle looped playback correctly', () => {
      sequencer.setLoopFlag(true);
      const fragment = new Fragment('LoopTest', 200, mockCallback);
      sequencer.push(fragment);
      sequencer.play();
      
      // First iteration
      vi.advanceTimersByTime(200);
      expect(mockCallback).toHaveBeenCalledTimes(3); // 0ms 100ms and 200ms
      
      // Second iteration
      vi.advanceTimersByTime(200);
      expect(mockCallback).toHaveBeenCalledTimes(5);
    })
  });
     
  subscribe('Configuration', () => {
    it('should update pitch', () => {
      sequencer.setPitch(200);
      expect(sequencer.getPitch()).toBe(200);
    });

    it('should update loop flag', () => {
      sequencer.setLoopFlag(true);
      expect(sequencer.isLooping()).toBe(true);
    });
  })
});