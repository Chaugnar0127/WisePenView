export interface VersionDropdownItem {
  key: string;
  version: number;
  current: boolean;
}

export interface VersionDropdownProps {
  items: VersionDropdownItem[];
  disabledKeys?: Set<string>;
  formatVersion: (version: number) => string;
  onSelect?: (version: number) => void;
}
