import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Menu,
  Search,
  UserCircle,
  X
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { SearchModal } from '@/components/ui/SearchModal';

// ============== Navigation Data ==============
interface SubMenuItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  submenu?: SubMenuItem[];
  isActive?: boolean;
}

const NAVIGATION: NavItem[] = [
  { 
    label: 'Início', 
    href: '/', 
    isActive: true,
    submenu: [
      { label: 'Portal do Aluno', href: '/' },
      { label: 'Portal do Professor', href: '#' },
    ]
  },
  { 
    label: 'Aulas/Cursos', 
    href: '#',
    submenu: [
      { label: 'Matemática', href: '#' },
      { label: 'Química', href: '#' },
      { label: 'Física', href: '#' },
    ]
  },
  { 
    label: 'Metodologia', 
    href: '#',
    submenu: [
      { label: 'Como Funciona', href: '#' },
      { label: 'Preços', href: '#' },
      { label: 'Sobre Portal Aluno', href: '#' },
    ]
  },
  { 
    label: 'Ebook', 
    href: '#',
    submenu: [
      { label: 'Inteligência Artifical nos Estudos', href: '#' },
      { label: 'O Conceito do ensino híbrido', href: '#' },
    ]
  },
  { 
    label: 'Blog e Vestibulares', 
    href: '#',
    submenu: [
      { label: 'Nosso Blog', href: '#' },
      { label: 'Matérias', href: '#' },
      { label: 'Portal de Vestibulares', href: '#' },
    ]
  },
  { label: 'Contato', href: '/contato' },
];

// ============== Header Component ==============
export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobileItem, setExpandedMobileItem] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Search state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 100);
  };

  const toggleMobileSubmenu = (label: string) => {
    setExpandedMobileItem(expandedMobileItem === label ? null : label);
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      setIsSearchModalOpen(true);
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <>
      {/* ==================== Mobile Menu Overlay ==================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ==================== Mobile Menu Drawer ==================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 left-0 h-full w-[300px] bg-white z-50 lg:hidden overflow-y-auto shadow-2xl"
          >
            {/* Close Button */}
            <button
              type="button"
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#0D6EFD] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Mobile Menu Inner */}
            <div className="p-6">
              {/* Logo */}
              <a href="/" className="block mb-8">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              </a>

              {/* Mobile Navigation */}
              <nav className="space-y-2">
                {NAVIGATION.map((item) => (
                  <div key={item.label}>
                    {item.submenu ? (
                      <>
                        <button
                          onClick={() => toggleMobileSubmenu(item.label)}
                          className={cn(
                            "w-full flex items-center justify-between py-3 px-4 text-left font-medium transition-colors rounded-lg",
                            item.isActive ? "text-[#0D6EFD] bg-[#E8F1FF]" : "text-[#222E48] hover:bg-gray-50"
                          )}
                        >
                          {item.label}
                          <ChevronDown className={cn(
                            "w-4 h-4 transition-transform duration-300",
                            expandedMobileItem === item.label && "rotate-180"
                          )} />
                        </button>
                        <AnimatePresence>
                          {expandedMobileItem === item.label && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden ml-4 border-l-2 border-[#E8F1FF]"
                            >
                              {item.submenu.map((sub) => (
                                <li key={sub.label}>
                                  <a
                                    href={sub.href}
                                    className="block py-2 px-4 text-sm text-gray-600 hover:text-[#0D6EFD] hover:bg-[#F8FAFC] rounded-r-lg transition-colors"
                                  >
                                    {sub.label}
                                  </a>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <a
                        href={item.href}
                        className="block py-3 px-4 font-medium text-[#222E48] hover:text-[#0D6EFD] hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        {item.label}
                      </a>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== Main Header ==================== */}
      <header id="header" className="header sticky top-0 z-30 bg-white border-b border-[#EBECEF]/50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <nav className="header-inner flex items-center justify-between gap-4 lg:gap-6 h-[72px] lg:h-[80px]">

            {/* Left Side: Logo + Category Selector */}
            <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0 h-full py-2">
              {/* Logo */}
              <div className="logo flex-shrink-0 h-full">
                <a href="/" className="block h-full">
                  <img 
                    src="/logo.png" 
                    alt="EduAll Logo" 
                    className="h-full w-auto object-contain"
                  />
                </a>
              </div>
            </div>


            {/* Center: Main Navigation Menu (Desktop Only) */}
            <div className="hidden lg:block flex-grow">
              <ul className="flex items-center justify-center gap-1">
                {NAVIGATION.map((item) => (
                  <li 
                    key={item.label} 
                    className="relative"
                    onMouseEnter={() => item.submenu && handleMouseEnter(item.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <a 
                      href={item.href}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-5 font-medium text-[15px] transition-colors",
                        item.isActive 
                          ? "text-[#0D6EFD]" 
                          : "text-[#222E48] hover:text-[#0D6EFD]"
                      )}
                    >
                      {item.label}
                      {item.submenu && (
                        <ChevronDown className={cn(
                          "w-3.5 h-3.5 transition-transform duration-300",
                          activeDropdown === item.label && "rotate-180"
                        )} />
                      )}
                    </a>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {item.submenu && activeDropdown === item.label && (
                        <motion.ul
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute top-full left-0 min-w-[220px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-xl border border-[#EBECEF] py-3 z-50 overflow-hidden"
                          onMouseEnter={() => handleMouseEnter(item.label)}
                          onMouseLeave={handleMouseLeave}
                        >
                          {item.submenu.map((sub) => (
                            <li key={sub.label}>
                              <a 
                                href={sub.href} 
                                className="block px-5 py-2.5 text-sm text-[#222E48]/80 hover:text-[#0D6EFD] hover:bg-[#E8F1FF]/50 font-medium transition-colors"
                              >
                                {sub.label}
                              </a>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Side: Search + User + Mobile Toggle */}
            <div className="flex items-center gap-4">
              {/* Search Bar (XL Screens Only) */}
              <form 
                className="hidden xl:flex items-center relative"
                onSubmit={handleSearchSubmit}
              >
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Buscar..."
                  className="w-56 rounded-full bg-[#E8F1FF] border border-[#EBECEF] px-5 py-2.5 pr-12 text-sm focus:border-[#0D6EFD] focus:bg-white outline-none transition-all placeholder:text-gray-400 font-medium"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* User Profile Action */}
              <motion.a 
                href="/login"
                className="group relative w-[52px] h-[52px] bg-[#E8F1FF] hover:bg-[#0D6EFD] border border-[#EBECEF] hover:border-[#0D6EFD] rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all duration-300 overflow-hidden xl:w-auto xl:min-w-[52px] xl:px-3.5"
                initial={false}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <UserCircle className="w-6 h-6 flex-shrink-0" />
                  <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-500 ease-in-out text-sm font-semibold hidden xl:block">
                    acesse o nosso portal
                  </span>
                </div>
              </motion.a>

              {/* Mobile Menu Toggle */}
              <button 
                type="button"
                className="lg:hidden text-[#222E48] hover:text-[#0D6EFD] transition-colors p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-7 h-7" />
              </button>
            </div>

          </nav>
        </div>
      </header>

      {/* ==================== Search Modal ==================== */}
      <SearchModal
        key={isSearchModalOpen ? 'search-modal-open' : 'search-modal-closed'}
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialQuery={searchQuery}
      />
    </>
  );
};

export default Header;
