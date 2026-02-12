import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  LayoutDashboard,
  Users,
  MessageSquare,
  BookOpen,
  HelpCircle,
  Star,
  GraduationCap,
  FileText,
  Settings,
  LogOut,
  CalendarCheck
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  userName: string;
  loading: boolean;
  onLogoutClick: () => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (value: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  userName,
  loading,
  onLogoutClick,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/setup-inicial' },
    { id: 'usuarios', label: 'Usuários', icon: Users, path: '/usuarios' },
    { id: 'message', label: 'Mensagens', icon: MessageSquare, path: '/mensagens' },
    { id: 'materias', label: 'Matérias', icon: BookOpen, path: '/materias' },
    { id: 'central-duvidas', label: 'Central de Dúvidas', icon: HelpCircle, path: '/central-duvidas-admin' },
    { id: 'temas', label: 'Temas', icon: Star, path: '/temas' },
    { id: 'quiz', label: 'Admin Testes', icon: GraduationCap, path: '/testes' },
    { id: 'dissertativas', label: 'Questões Dissertativas', icon: FileText, path: '/questoes-dissertativas' },
    { id: 'frequencia-pagamentos', label: 'Frequência e Pagamentos', icon: CalendarCheck, path: '/frequencia-pagamentos' },
  ];

  const isActive = (path: string) => {
    if (path === '#' || !path) return false;
    return location.pathname === path;
  };

  return (
    <div className=''>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden glass"
          onClick={() => setIsMobileOpen?.(false)}
        />
      )}

      <aside className={`
        fixed md:relative 
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
        ${isCollapsed ? 'w-24' : 'w-72'} 
        bg-white h-full flex flex-col transition-all duration-300 
        shadow-2xl shadow-gray-200/50 z-50 top-0 left-0
      `}>
      {/* Toggle Button (Desktop only) */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 w-8 h-8 bg-white rounded-full hidden md:flex items-center justify-center text-[#A3AED0] hover:text-[#0061FF] shadow-lg hover:shadow-[#0061FF]/20 z-30 transition-all duration-300"
        style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        <ChevronLeft size={16} />
      </button>

      {/* Close Button (Mobile only) */}
      <button 
        onClick={() => setIsMobileOpen?.(false)}
        className="absolute right-4 top-4 md:hidden text-[#A3AED0] hover:text-[#0061FF]"
      >
        <ChevronLeft size={24} />
      </button>

      <div className={`p-10 flex items-center justify-center ${isCollapsed ? 'px-4' : ''}`}>
        <img 
          src="/logo.png" 
          alt="EduAll Logo" 
          className={`${isCollapsed ? 'w-14 h-14' : 'h-20 w-auto'} object-contain transition-all duration-500 hover:scale-105 cursor-pointer`}
          onClick={() => navigate('/setup-inicial')}
        />
      </div>
      
      <div className={`${isCollapsed ? 'px-4' : 'px-6'} mb-4 overflow-hidden flex-1 overflow-y-auto`}>
        {!isCollapsed && (
          <p className="text-xs font-bold text-[#A3AED0] uppercase tracking-widest mb-4 px-2 whitespace-nowrap">
            {loading ? 'Carregando...' : `Bem vindo: ${userName}`}
          </p>
        )}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                title={isCollapsed ? item.label : ''}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 px-4'} py-3 rounded-xl font-bold transition-all duration-200 ${
                  active
                    ? 'bg-[#0061FF] text-white shadow-xl shadow-[#0061FF]/30'
                    : 'text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#1B2559]'
                }`}
                onClick={() => {
                  if(item.path !== '#') {
                    navigate(item.path);
                    setIsMobileOpen?.(false);
                  }
                }}
              >
                <item.icon size={20} className="min-w-[20px]" />
                {!isCollapsed && <span className="text-[15px] whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className={`mt-auto ${isCollapsed ? 'px-4' : 'px-6'} pb-8 space-y-4 overflow-hidden flex-shrink-0`}>
        <div>
          {!isCollapsed && <p className="text-xs font-bold text-[#A3AED0] uppercase tracking-widest mb-4 px-2 whitespace-nowrap">Admin</p>}
          <button 
            title={isCollapsed ? 'Settings' : ''}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 px-4'} py-3 rounded-xl font-bold text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#1B2559] transition-all`}
          >
            <Settings size={20} className="min-w-[20px]" />
            {!isCollapsed && <span className="text-[15px] whitespace-nowrap">Settings</span>}
          </button>
        </div>
        <button 
          title={isCollapsed ? 'Logout' : ''}
          onClick={onLogoutClick}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 px-4'} py-3 rounded-xl font-bold text-[#A3AED0] hover:text-red-500 transition-all ${!isCollapsed ? 'mt-4' : 'mt-2'} group`}
        >
          <div className={`p-2 rounded-lg group-hover:bg-red-50 transition-colors`}>
            <LogOut size={20} className="min-w-[20px]" />
          </div>
          {!isCollapsed && <span className="text-[15px] whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </aside>
    </div>
  );
};
