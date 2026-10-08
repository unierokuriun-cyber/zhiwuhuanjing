import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Sprout,
  Heart,
  UsersRound,
  UserRound,
  Leaf,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDialogFocus } from "../hooks/useDialogFocus";
export const navigation = [
  { to: "/garden", label: "我的花园", icon: Sprout },
  { to: "/care", label: "智能养护", icon: Sparkles },
  { to: "/companion", label: "植物伙伴", icon: Heart },
  { to: "/community", label: "植物社区", icon: UsersRound },
  { to: "/profile", label: "我的", icon: UserRound },
];
import { usePreferences } from "../store/preferences";
import { getStorageError } from "../store/storage";
export function AppLayout() {
  const [storageError, setStorageError] = useState(getStorageError);
  useEffect(() => {
    const update = () => setStorageError(getStorageError());
    window.addEventListener("garden-storage-error", update);
    return () => window.removeEventListener("garden-storage-error", update);
  }, []);
  const name = usePreferences((s) => s.name);
  useDialogFocus();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `植伴 · ${navigation.find((n) => pathname.startsWith(n.to))?.label || "植物空间"}`;
  }, [pathname]);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/garden" className="brand">
          <span className="brand-mark">
            <Leaf />
          </span>
          <span>
            植伴<small>PLANT COMPANION</small>
          </span>
        </NavLink>
        <p className="nav-caption">你的植物生活空间</p>
        <nav aria-label="主导航">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-item ${isActive || (to === "/garden" && pathname.startsWith("/plants")) ? "active" : ""}`
              }
            >
              <Icon size={21} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <Sprout size={28} />
          <h3>一点照顾，一点生长。</h3>
          <p>
            每一个平凡的日子，
            <br />
            都值得与绿意一起度过。
          </p>
          <NavLink to="/companion">
            去看看植物伙伴 <ChevronRight size={16} />
          </NavLink>
        </div>
        <NavLink to="/profile" className="sidebar-user">
          <span className="avatar">{name.slice(0, 1)}</span>
          <div>
            {name}
            <small>本地演示用户</small>
          </div>
          <ChevronRight size={16} />
        </NavLink>
      </aside>
      <main className="main-content">
        {storageError && pathname !== "/garden" && (
          <p className="notice-panel" role="alert">
            {storageError}
          </p>
        )}
        <Outlet />
      </main>
      <nav className="mobile-nav" aria-label="底部导航">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive || (to === "/garden" && pathname.startsWith("/plants"))
                ? "active"
                : ""
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
