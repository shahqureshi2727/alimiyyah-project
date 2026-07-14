import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/settings';
import './AuthHeader.css';

export default function AuthHeader({ hidden = false }) {
  const { username, isAdmin, signOut } = useAuth();
  const { settings, setArabicScript, setTheme } = useSettings();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const handleSignOut = async () => {
    setMenuOpen(false);
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleAdmin = () => {
    setMenuOpen(false);
    navigate('/admin');
  };

  const handleWeakness = () => {
    setMenuOpen(false);
    navigate('/weakness');
  };

  const handleSettings = () => {
    setMenuOpen(false);
    setSettingsOpen(true);
  };

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  // Close menu on Escape
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (menuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [menuOpen]);

  // Keyboard navigation
  const handleKeyDown = (event) => {
    if (!menuOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        setMenuOpen(true);
      }
      return;
    }

    const menuItems = menuRef.current?.querySelectorAll('[role="menuitem"]');
    if (!menuItems?.length) return;

    const currentIndex = Array.from(menuItems).findIndex(
      (item) => item === document.activeElement
    );

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (currentIndex < menuItems.length - 1) {
          menuItems[currentIndex + 1].focus();
        } else {
          menuItems[0].focus();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex > 0) {
          menuItems[currentIndex - 1].focus();
        } else {
          menuItems[menuItems.length - 1].focus();
        }
        break;
      case 'Tab':
        setMenuOpen(false);
        break;
    }
  };

  // Focus first menu item when menu opens
  useEffect(() => {
    if (menuOpen) {
      const firstItem = menuRef.current?.querySelector('[role="menuitem"]');
      firstItem?.focus();
    }
  }, [menuOpen]);

  if (hidden) {
    return null;
  }

  return (
    <header className="auth-header">
      <div className="auth-header-content">
        <div className="auth-header-left">
          {/* Empty for now - logo could go here */}
        </div>
        <div className="auth-header-right">
          <div className="user-menu-container">
            <button
              ref={buttonRef}
              className={`user-menu-trigger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              onKeyDown={handleKeyDown}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="user-menu-name">{username}</span>
              <span className="user-menu-chevron">▾</span>
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                className="user-menu-dropdown"
                role="menu"
                onKeyDown={handleKeyDown}
              >
                {isAdmin && (
                  <button
                    className="user-menu-item"
                    role="menuitem"
                    onClick={handleAdmin}
                  >
                    Admin
                  </button>
                )}
                <button
                  className="user-menu-item"
                  role="menuitem"
                  onClick={handleWeakness}
                >
                  Strength map
                </button>
                <button
                  className="user-menu-item"
                  role="menuitem"
                  onClick={handleSettings}
                >
                  Settings
                </button>
                <button
                  className="user-menu-item"
                  role="menuitem"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {settingsOpen && (
        <div className="settings-overlay" role="presentation">
          <div className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="settings-panel-header">
              <h2 id="settings-title">Settings</h2>
              <button
                className="settings-close"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
              >
                ×
              </button>
            </div>

            <div className="settings-group">
              <span className="settings-label">Theme</span>
              <div className="settings-options">
                {[
                  ['light', 'Light'],
                  ['dark', 'Dark'],
                  ['system', 'System'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={`settings-option ${settings.theme === value ? 'active' : ''}`}
                    onClick={() => setTheme(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-group">
              <span className="settings-label">Arabic Script</span>
              <div className="settings-options">
                {[
                  ['madina', 'Madina'],
                  ['indopak', 'Indo-Pak'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={`settings-option ${settings.arabicScript === value ? 'active' : ''}`}
                    onClick={() => setArabicScript(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
