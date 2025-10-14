import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';


const Header = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-lg border-b border-slate-300">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand - Far Left */}
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center">
              <img 
                src="https://media.istockphoto.com/id/1271062031/vector/artificial-intelligence-icon.jpg?s=612x612&w=0&k=20&c=XAnrAjJW4HDSj11Y6JCqar3dRMimt3YIRwZB6RkEEcA=" 
                alt="Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full object-cover border border-slate-300"
              />
          </Link>
        </div>


          {/* Navigation Menu - Desktop */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-bold transition-colors duration-200 border ${
                isActive('/') 
                  ? 'text-white bg-blue-600 border-slate-300' 
                  : 'text-black hover:text-blue-600 border-transparent hover:border-blue-500'
              }`}
            >
              Home
            </Link>
            <Link
              to="/analysis"
              className={`px-3 py-2 rounded-md text-sm font-bold transition-colors duration-200 border ${
                isActive('/analysis') 
                  ? 'text-white bg-slate-700 border-slate-300' 
                  : 'text-black hover:text-slate-700 border-transparent hover:border-slate-500'
              }`}
            >
              Analysis
            </Link>
            <Link
              to="/about"
              className={`px-3 py-2 rounded-md text-sm font-bold transition-colors duration-200 border ${
                isActive('/about') 
                  ? 'text-white bg-blue-600 border-slate-300' 
                  : 'text-black hover:text-blue-600 border-transparent hover:border-blue-500'
              }`}
            >
              About Us
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="text-black hover:text-blue-600 inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 border border-slate-300"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu (with smooth transitions) */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen 
              ? 'max-h-64 opacity-100' 
              : 'max-h-0 opacity-0'
          }`} 
          id="mobile-menu"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className={`block px-3 py-2 rounded-md text-base font-bold transition-colors duration-200 border ${
                isActive('/') 
                  ? 'text-white bg-blue-600 border-slate-300' 
                  : 'text-black hover:text-blue-600 border-transparent'
              }`}
            >
              Home
            </Link>
            <Link
              to="/analysis"
              onClick={closeMobileMenu}
              className={`block px-3 py-2 rounded-md text-base font-bold transition-colors duration-200 border ${
                isActive('/analysis') 
                  ? 'text-white bg-slate-700 border-slate-300' 
                  : 'text-black hover:text-slate-700 border-transparent'
              }`}
            >
              Analysis
            </Link>
            <Link
              to="/about"
              onClick={closeMobileMenu}
              className={`block px-3 py-2 rounded-md text-base font-bold transition-colors duration-200 border ${
                isActive('/about') 
                  ? 'text-white bg-blue-600 border-slate-300' 
                  : 'text-black hover:text-blue-600 border-transparent'
              }`}
            >
              About Us
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;