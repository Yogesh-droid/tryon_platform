import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="dash-header">
        <h1 className="brand">Panel</h1>
        <button className="logout" onClick={handleLogout}>Log out</button>
      </header>

      <nav className="tab-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Overview</NavLink>
        <NavLink to="/catalog" className={({ isActive }) => (isActive ? 'active' : '')}>Catalog</NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>Profile</NavLink>
      </nav>

      <main className="page-body">
        <Outlet />
      </main>
    </div>
  );
}