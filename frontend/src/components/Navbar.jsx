import { useState, useRef, useEffect } from 'react';
import { useScrolled, useActiveSection } from '../hooks/index.js';
import { useAuth } from '../App.jsx';

const NAV_LINKS = [
  { id: 'products', label: 'Products' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Quick Access' },
  { id: 'contact', label: 'Contact' },
];

const ALL_SECTIONS = ['home', 'products', 'about', 'services', 'scm', 'clients', 'contact'];

export default function Navbar({ onSignIn, onAccount }) {
  const scrolled = useScrolled(60);
  const active = useActiveSection(ALL_SECTIONS);
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const dropRef = useRef(null);

  const { user, logout } = useAuth();

  const goto = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdown(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <>
      <nav
        className={`fixed left-0 right-0 z-40 transition-all duration-500 ${
          scrolled
            ? 'bg-ink-900/95 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
            : 'bg-transparent'
        }`}
        style={{ top: '32px' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <button onClick={() => goto('home')} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-ember flex items-center justify-center font-fraunces font-bold text-white text-lg">
              S
            </div>
            <div className="text-left leading-none">
              <div className="font-fraunces font-bold text-cream text-lg">
                Sloka<span className="text-ember">NE</span>
              </div>
              <div className="text-smoke text-[9px] tracking-[0.2em] uppercase font-outfit mt-0.5">
                Consultancy · SCM · Manufacturing
              </div>
            </div>
          </button>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-1 list-none">
            {NAV_LINKS.map(({ id, label }) => (
              <li key={id}>
                <button
                  onClick={() => goto(id)}
                  className={`px-4 py-2 rounded-lg text-sm font-outfit font-medium ${
                    active === id
                      ? 'text-ember bg-ember/10'
                      : 'text-smoke-light hover:text-cream hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>

          {/* RIGHT SIDE */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropdown(!dropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5"
                >
                  <div className="w-7 h-7 rounded-full bg-ember flex items-center justify-center text-white font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-cream">
                    {user.name?.split(' ')[0]}
                  </span>
                </button>

                {dropdown && (
                  <div className="absolute right-0 mt-2 w-52 bg-ink-800 border border-white/10 rounded-xl shadow-lg">
                    <div className="p-3 border-b border-white/10">
                      <p className="text-cream text-sm">{user.name}</p>
                      <p className="text-smoke text-xs">{user.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setDropdown(false);
                        onAccount();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-white/5"
                    >
                      My Account
                    </button>

                    <button
                      onClick={() => {
                        setDropdown(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="px-5 py-2.5 bg-ember text-white rounded-full"
              >
                → Sign In
              </button>
            )}
          </div>

          {/* Mobile menu */}
          <button onClick={() => setOpen(!open)} className="md:hidden">
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 bg-ink-900 flex flex-col items-center justify-center gap-6 z-30">
          {NAV_LINKS.map(({ id, label }) => (
            <button key={id} onClick={() => goto(id)} className="text-2xl text-white">
              {label}
            </button>
          ))}

          {user ? (
            <>
              <button onClick={onAccount}>My Account</button>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <button onClick={onSignIn}>Sign In</button>
          )}
        </div>
      )}
    </>
  );
}