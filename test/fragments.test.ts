import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Fragment, IndependentFragment } from '../src/fragments';

describe('Fragment Class', () => {
  it('should create fragment with unique ID', () => {
    const frag1 = new Fragment('Test', 1000);
    const frag2 = new Fragment('Test', 1000);
    expect(frag1.getId()).not.toBe(frag2.getId());
  });

  describe('Property Accessors', () => {
    let fragment: Fragment;

    beforeEach(() => {
      fragment = new Fragment('Initial', 500, () => console.log('test'));
    });

    it('should get name', () => {
      expect(fragment.getName()).toBe('Initial');
    });

    it('should update name', () => {
      fragment.setName('Updated');
      expect(fragment.getName()).toBe('Updated');
    });

    it('should get duration', () => {
      expect(fragment.getDuration()).toBe(500);
    });

    it('should update duration', () => {
      fragment.setDuration(1000);
      expect(fragment.getDuration()).toBe(1000);
    });

    it('should get callback', () => {
      expect(typeof fragment.getCallback()).toBe('function');
    });

    it('should update callback', () => {
      const newCb = () => console.log('new');
      fragment.setCallback(newCb);
      expect(fragment.getCallback()).toBe(newCb);
    });
  });

  describe('Copy Method', () => {
    it('should create copy with different ID', () => {
      const original = new Fragment('Original', 1000);
      const copy = original.copy();
      expect(copy).instanceOf(Fragment);
      expect(copy.getId()).not.toBe(original.getId());
      expect(copy.getName()).toBe(original.getName());
      expect(copy.getDuration()).toBe(original.getDuration());
    });
  });
});

describe('IndependentFragment Class', () => {
  it('should create with start point', () => {
    const fragment = new IndependentFragment('test', 1000, 500);
    expect(fragment.getStartPoint()).toBe(500);
  });

  it('should update start point', () => {
    const fragment = new IndependentFragment('test', 1000, 500);
    fragment.setStartPoint(750);
    expect(fragment.getStartPoint()).toBe(750);
  });

  it('should calculate end time', () => {
    const fragment = new IndependentFragment('test', 1000, 500);
    expect(fragment.getStartPoint() + fragment.getDuration()).toBe(1500);
  });

  it('should copy with all properties', () => {
    const original = new IndependentFragment('test', 1000, 500);
    const copy = original.copy();
    expect(copy).toBeInstanceOf(IndependentFragment);
    expect(copy.getStartPoint()).toBe(original.getStartPoint());
    expect(copy.getDuration()).toBe(original.getDuration());
  });

  it('should maintain callback through copy', () => {
    const mockCallback = vi.fn();
    const original = new IndependentFragment('test', 1000, 500, mockCallback);
    const copy = original.copy();
    copy.getCallback()!();
    expect(mockCallback).toHaveBeenCalled();
  });
});