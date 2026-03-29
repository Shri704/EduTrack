import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const SidebarDrawerContext = createContext(null);

export function SidebarDrawerProvider({ children }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  const value = useMemo(
    () => ({ open, setOpen, close, toggle }),
    [open, close, toggle]
  );

  return (
    <SidebarDrawerContext.Provider value={value}>
      {children}
    </SidebarDrawerContext.Provider>
  );
}

export function useSidebarDrawer() {
  const ctx = useContext(SidebarDrawerContext);
  if (!ctx) {
    throw new Error("useSidebarDrawer must be used within SidebarDrawerProvider");
  }
  return ctx;
}
