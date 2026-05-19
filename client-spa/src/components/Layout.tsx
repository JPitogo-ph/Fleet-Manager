import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/Auth/useAuth";

const links = [
  { to: "/vehicles", label: "Vehicles" },
  { to: "/drivers", label: "Drivers" },
  { to: "/trips", label: "Trips" },
  { to: "/reports", label: "Reports" },
];

export function Layout() {
  const { user } = useAuth();

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <nav
        style={{
          width: 220,
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem 1rem",
        }}
      >
        <span style={{ fontWeight: 500, margin: 32 }}>Fleet Manager</span>

        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({ fontWeight: isActive ? 500 : 400 })}
          >
            {link.label}
          </NavLink>
        ))}

        <div style={{ marginTop: "auto" }}>
          <div>{user?.name}</div>
          <a href="/auth/login">Sign Out</a>
        </div>
      </nav>

      <main style={{ flex: 1, overflow: "auto", padding: "2rem" }}>
        <Outlet />
      </main>
    </div>
  );
}
