import { Component, type ReactNode } from "react";
import type { ContentField } from "./content-renders";
import type { ContentSession } from "./content-slots";

/** What a failure is reported as, and what clears it: a new location or function. */
export interface FailureScope {
  readonly location: unknown;
  readonly render: unknown;
  readonly field: ContentField;
  readonly session: ContentSession;
}

interface BoundaryProps extends FailureScope {
  readonly id: string;
  readonly children: ReactNode;
}

/**
 * Renders nothing once the content throws, reporting it as an `invalid-input` error event; the map
 * stays. Cleared, not remounted, when the location or the function changes: a key would remount
 * the content, and lose its state, at every render of a parent passing an inline function.
 */
export class ContentBoundary extends Component<BoundaryProps, { readonly failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    const { session, id, field } = this.props;
    session.failed(id, field, error);
  }

  override componentDidUpdate(previous: BoundaryProps) {
    const changed =
      previous.location !== this.props.location || previous.render !== this.props.render;
    if (this.state.failed && changed) this.setState({ failed: false });
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}
