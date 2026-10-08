import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeStorage } from "./storage";
type Preferences = {
  name: string;
  bio: string;
  reminders: boolean;
  update: (values: {
    name?: string;
    bio?: string;
    reminders?: boolean;
  }) => void;
};
export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      name: "林间",
      bio: "一点照顾，一点生长。",
      reminders: true,
      update: (values) => set(values),
    }),
    {
      name: "plant-companion-preferences-v1",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ name: s.name, bio: s.bio, reminders: s.reminders }),
    },
  ),
);
