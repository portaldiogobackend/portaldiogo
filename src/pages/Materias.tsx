import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { BookOpen, ChevronLeft, Edit, Menu, Plus, Search, Shield, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutModal } from '../components/layout/LogoutModal';
import { Sidebar } from '../components/layout/Sidebar';


import { format } from 'date-fns';

interface Materia {
  id: string;
  materia: string;
  created_at: string;
  alunosCount?: number;
}

export const Materias: React.FC = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState<string>('Admin');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // CRUD States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMateria, setCurrentMateria] = useState<Materia | null>(null);
  const [materiaName, setMateriaName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const checkUserCode = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('tbf_controle_user')
        .select('nome, role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserName(data.nome.split(' ')[0]);
        setUserRole(data.role || 'user');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/');
    }
  }, [navigate]);

  const fetchMaterias = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tbf_materias')
        .select('*')
        .order('materia', { ascending: true });

      if (error) throw error;

      // Fetch counts using RPC function for better performance
      const { data: countsData, error: countsError } = await supabase
        .rpc('get_materia_student_counts');

      if (countsError) {
        console.error('Error fetching counts:', countsError);
      }

      const counts: Record<string, number> = {};
      if (countsData) {
        countsData.forEach((item: { materia_id: string; count: number }) => {
          counts[item.materia_id] = item.count;
        });
      }

      const materiasWithCounts = (data || []).map(m => ({
        ...m,
        alunosCount: counts[m.id] || 0
      }));

      setMaterias(materiasWithCounts);
    } catch (error) {
      console.error('Error fetching materias:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUserCode();
  }, [checkUserCode]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchMaterias();
    } else if (userRole) {
      setLoading(false); // Stop loading if role is determined but not admin
    }
  }, [userRole, fetchMaterias]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiaName.trim()) return;

    try {
      setIsSaving(true);
      
      if (currentMateria) {
        // Edit
        const { error } = await supabase
          .from('tbf_materias')
          .update({ materia: materiaName })
          .eq('id', currentMateria.id);

        if (error) throw error;
        
        // Update local state and sort
        const updatedMaterias = materias.map(m => m.id === currentMateria.id ? { ...m, materia: materiaName } : m);
        setMaterias(updatedMaterias);
      } else {
        // Create
        const { data, error } = await supabase
          .from('tbf_materias')
          .insert([{ materia: materiaName }])
          .select()
          .single();

        if (error) throw error;
        
        // Update local state and sort
        setMaterias([...materias, data]);
      }

      closeModal();
    } catch (error) {
      console.error('Error saving materia:', error);
      alert('Erro ao salvar matéria.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta matéria?')) return;

    try {
      setIsDeleting(id);
      const { error } = await supabase
        .from('tbf_materias')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMaterias(materias.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting materia:', error);
      alert('Erro ao excluir matéria.');
    } finally {
      setIsDeleting(null);
    }
  };

  const openModal = (materia?: Materia) => {
    if (materia) {
      setCurrentMateria(materia);
      setMateriaName(materia.materia);
    } else {
      setCurrentMateria(null);
      setMateriaName('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentMateria(null);
    setMateriaName('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Filter and Sort logic
  const filteredMaterias = materias
    .filter(m => m.materia.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.materia.localeCompare(b.materia, 'pt-BR', { sensitivity: 'base' }));

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F7FE]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="flex h-screen bg-[#F4F7FE] font-sans text-[#2B3674]">
        <Sidebar 
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          userName={userName}
          loading={loading}
          onLogoutClick={() => setShowLogoutModal(true)}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        <div className="flex-1 flex items-center justify-center p-4">
             <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-300">
                    <Shield size={40} />
                </div>
                <div>
                   <h1 className="text-2xl font-bold text-[#1B2559]">Acesso Restrito</h1>
                   <p className="text-[#A3AED0] mt-2">Apenas administradores podem acessar esta página.</p>
                </div>
                <Button onClick={() => navigate('/setup-inicial')} variant="primary">
                    Voltar ao Dashboard
                </Button>
            </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans text-[#2B3674]">
      <Sidebar 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        userName={userName}
        loading={loading}
        onLogoutClick={() => setShowLogoutModal(true)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={currentMateria ? 'Editar Matéria' : 'Nova Matéria'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="text-sm font-bold text-[#1B2559] block mb-2">Nome da Matéria</label>
                <input 
                    type="text"
                    required
                    value={materiaName}
                    onChange={(e) => setMateriaName(e.target.value)}
                    placeholder="Ex: Matemática Financeira"
                    className="w-full px-4 py-3 bg-[#F4F7FE] border-none rounded-xl text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none"
                    autoFocus
                />
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={closeModal}>
                    Cancelar
                </Button>
                <Button type="submit" variant="primary" isLoading={isSaving}>
                    {currentMateria ? 'Salvar Alterações' : 'Cadastrar Matéria'}
                </Button>
            </div>
        </form>
      </Modal>

      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <header className="min-h-[80px] md:h-24 flex items-center justify-between px-4 md:px-10 py-4 gap-4 bg-[#F4F7FE] md:bg-transparent z-10">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-[#1B2559] p-2 hover:bg-white/50 rounded-lg transition-colors"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={24} />
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[#A3AED0] hover:text-[#0061FF] font-bold transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="hidden md:inline">Voltar</span>
            </button>
          </div>
          
          <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] truncate">Gestão de Matérias</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4">
          <div className="max-w-[1200px] mx-auto">
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none">
                {/* Header do Card */}
                <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#F4F7FE] text-[#0061FF] rounded-xl flex items-center justify-center flex-shrink-0">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#1B2559]">Matérias Cadastradas</h2>
                            <p className="text-sm text-[#A3AED0]">Gerencie as disciplinas do curso</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3AED0]" />
                            <input 
                                type="text"
                                placeholder="Buscar matéria..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 pl-11 pr-4 py-2.5 bg-[#F4F7FE] border-none rounded-xl text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none text-sm"
                            />
                        </div>
                        <Button 
                            variant="primary" 
                            onClick={() => openModal()}
                            className="whitespace-nowrap"
                        >
                            <Plus size={18} className="mr-2" />
                            Nova Matéria
                        </Button>
                    </div>
                </div>

                {/* Lista de Matérias */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[#A3AED0] text-sm border-b border-gray-50 uppercase tracking-wider">
                                <th className="px-8 py-6 font-semibold">Nome da Matéria</th>
                                <th className="px-8 py-6 font-semibold w-32 text-center">Alunos</th>
                                <th className="px-8 py-6 font-semibold w-48">Criado em</th>
                                <th className="px-8 py-6 font-semibold text-right w-32">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredMaterias.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-8 py-12 text-center text-[#A3AED0]">
                                        {searchQuery ? 'Nenhuma matéria encontrada.' : 'Nenhuma matéria cadastrada ainda.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredMaterias.map((materia) => (
                                    <tr key={materia.id} className="hover:bg-[#F4F7FE]/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="text-[#1B2559] font-bold text-base">{materia.materia}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="bg-[#F4F7FE] text-[#0061FF] py-1 px-3 rounded-full text-xs font-bold">
                                                {materia.alunosCount || 0}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-[#A3AED0] text-sm font-medium">
                                                {format(new Date(materia.created_at), 'dd/MM/yyyy')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => openModal(materia)}
                                                    className="p-2 rounded-lg text-[#A3AED0] hover:text-[#0061FF] hover:bg-blue-50 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(materia.id)}
                                                    className="p-2 rounded-lg text-[#A3AED0] hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    title="Excluir"
                                                    disabled={isDeleting === materia.id}
                                                >
                                                    {isDeleting === materia.id ? <Spinner size="sm" /> : <Trash2 size={18} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Footer do Card com contagem */}
                <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50/30">
                    <p className="text-sm text-[#A3AED0] font-medium">
                        Total de <span className="text-[#1B2559] font-bold">{filteredMaterias.length}</span> matérias cadastradas
                    </p>
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
