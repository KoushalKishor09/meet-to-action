import { useEffect, useRef } from "react";

function Navbar({ activeNav, onNavigate, menuOpen, setMenuOpen }) {
  const mobileMenuRef = useRef(null);

  const handleNavClick = (page) => {
    onNavigate(page);
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, setMenuOpen]);

  return (
    <nav className="navbar" aria-label="Main navigation" ref={mobileMenuRef}>
      <div className="navbar-inner">
        <button
          className="navbar-brand"
          onClick={() => handleNavClick("home")}
          aria-label="Meet to Action — AI Task Extraction, go to home"
        >
          Meet to Action &mdash; AI Task Extraction
        </button>

        <ul className="nav-links">
          <li>
            <button
              className={`nav-link${activeNav === "home" ? " nav-link--active" : ""}`}
              onClick={() => handleNavClick("home")}
            >
              Home
            </button>
          </li>
          <li>
            <button
              className={`nav-link${activeNav === "about" ? " nav-link--active" : ""}`}
              onClick={() => handleNavClick("about")}
            >
              About Us
            </button>
          </li>
          <li>
            <a
              className="nav-link"
              href="https://github.com/KoushalKishor09/meet-to-action"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </li>
        </ul>

        <button
          className="hamburger-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <ul
          id="mobile-menu"
          className="mobile-menu"
        >
          <li>
            <button
              className={`mobile-nav-link${activeNav === "home" ? " nav-link--active" : ""}`}
              onClick={() => handleNavClick("home")}
            >
              Home
            </button>
          </li>
          <li>
            <button
              className={`mobile-nav-link${activeNav === "about" ? " nav-link--active" : ""}`}
              onClick={() => handleNavClick("about")}
            >
              About Us
            </button>
          </li>
          <li>
            <a
              className="mobile-nav-link"
              href="https://github.com/KoushalKishor09/meet-to-action"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
            >
              GitHub
            </a>
          </li>
        </ul>
      )}
    </nav>
  );
}

export default Navbar;
