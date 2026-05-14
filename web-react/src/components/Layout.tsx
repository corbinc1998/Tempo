import { Link, Outlet } from 'react-router-dom';

/**
 * Top-level layout used by all routes.
 *
 * The <Outlet /> is where child route components render. Add nav links, footers,
 * banners, etc here once and they appear on every page.
 */
export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            Tempo
          </Link>
          <nav className="flex gap-6 text-sm text-gray-700">
            <Link to="/dashboard" className="hover:text-gray-900">Dashboard</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        Tempo - <a href="https://thetempo.web.app" className="underline">thetempo.web.app</a>
      </footer>
    </div>
  );
}
