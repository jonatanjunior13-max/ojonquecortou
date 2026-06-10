import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Reveal } from '../components/NewDesignComponents';

describe('Reveal Component', () => {
  let intersectionCallback;
  let observeMock;
  let disconnectMock;

  beforeEach(() => {
    observeMock = vi.fn();
    disconnectMock = vi.fn();

    window.IntersectionObserver = class {
      constructor(callback) {
        intersectionCallback = callback;
      }
      observe = observeMock;
      disconnect = disconnectMock;
    };

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('renders children and has base classes without "in" initially', () => {
    render(
      <Reveal className="custom-class" data-testid="reveal">
        <span>Content</span>
      </Reveal>
    );

    const element = screen.getByTestId('reveal');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Content');
    expect(element).toHaveClass('reveal');
    expect(element).toHaveClass('custom-class');
    expect(element).not.toHaveClass('in');
    expect(observeMock).toHaveBeenCalledWith(element);
  });

  it('adds "in" class when intersecting (no delay)', () => {
    render(
      <Reveal data-testid="reveal">
        <span>Content</span>
      </Reveal>
    );

    const element = screen.getByTestId('reveal');
    expect(element).not.toHaveClass('in');

    // Trigger intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    // Fast-forward any timers (though delay is 0)
    act(() => {
      vi.runAllTimers();
    });

    expect(element).toHaveClass('in');
    expect(disconnectMock).toHaveBeenCalled();
  });

  it('adds "in" class after specified delay', () => {
    render(
      <Reveal data-testid="reveal" delay={500}>
        <span>Content</span>
      </Reveal>
    );

    const element = screen.getByTestId('reveal');

    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    // Class should not be added immediately
    expect(element).not.toHaveClass('in');

    // Fast-forward part of the delay
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(element).not.toHaveClass('in');

    // Fast-forward the rest of the delay
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(element).toHaveClass('in');
  });

  it('disconnects observer on unmount', () => {
    const { unmount } = render(
      <Reveal>
        <span>Content</span>
      </Reveal>
    );

    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });
});
