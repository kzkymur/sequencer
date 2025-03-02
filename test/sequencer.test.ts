import { describe, expect, it, vi, beforeEach } from 'vitest';
import '@vitest/web-worker'
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
      
      vi.advanceTimersByTime(50); // 150ms
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
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
  });

  describe('Configuration', () => {
    it('should update pitch', () => {
      sequencer.setPitch(200);
      expect(sequencer.getPitch()).toBe(200);
    });

    it('should update loop flag', () => {
      sequencer.setLoopFlag(true);
      expect(sequencer.isLooping()).toBe(true);
    });
  });
});
      