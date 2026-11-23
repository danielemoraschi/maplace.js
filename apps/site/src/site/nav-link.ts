/** A link of a page's side column: one of the pages it lists, and the pages under it, if any. */
export interface NavLink {
  readonly href: string;
  readonly label: string;
  readonly children?: readonly NavLink[];
}
