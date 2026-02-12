import React, { useState, useEffect } from 'react';
import { Users, ChevronLeft, Edit, Trash2, Plus, Mail, Shield, Signature, Search, ChevronUp, ChevronDown, Filter, X, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { LogoutModal } from '../components/layout/LogoutModal';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  signature: string;
  role: string;
  created_at: string;
  materias?: string[];
  serie?: string;
  tbf_serie?: {
    serie: string;
  };
}

interface Materia {
  id: string;
  materia: string;
}

interface Serie {
  id: string;
  serie: string;
}

const Usuarios: React.FC = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState<string>('Admin');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    nome: '',
    sobrenome: '',
    signature: '',
    role: '',
    materias: [] as string[],
    serie: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // New States for Filtering, Searching and Sorting with persistence
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(() => 
    sessionStorage.getItem('user_role_filter') || 'all'
  );
  const [signatureFilter, setSignatureFilter] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('user_signature_filter');
    return saved ? JSON.parse(saved) : ['ativo'];
  });
  const [showAll, setShowAll] = useState(() => 
    sessionStorage.getItem('user_show_all') === 'true'
  );
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>(() => {
    const saved = sessionStorage.getItem('user_sort_config');
    return saved ? JSON.parse(saved) : { key: 'nome', direction: 'asc' };
  });

  useEffect(() => {
    sessionStorage.setItem('user_role_filter', roleFilter);
  }, [roleFilter]);

  useEffect(() => {
    sessionStorage.setItem('user_signature_filter', JSON.stringify(signatureFilter));
  }, [signatureFilter]);

  useEffect(() => {
    sessionStorage.setItem('user_show_all', showAll.toString());
  }, [showAll]);

  useEffect(() => {
    sessionStorage.setItem('user_sort_config', JSON.stringify(sortConfig));
  }, [sortConfig]);

  useEffect(() => {
    fetchUserData();
    fetchAllUsers();
    fetchMaterias();
    fetchSeries();
    logAudit('access_users_list', null, { page: 'Usuarios' });
  }, []);

  const logAudit = async (action: string, targetId: string | null, details: any = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('audit_logs').insert({
        admin_id: user.id,
        action,
        target_id: targetId,
        details
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('tbf_controle_user')
          .select('nome')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (data?.nome) {
          setUserName(data.nome.split(' ')[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchMaterias = async () => {
    try {
      const { data, error } = await supabase
        .from('tbf_materias')
        .select('*')
        .order('materia', { ascending: true });

      if (error) throw error;
      setMaterias(data || []);
    } catch (error) {
      console.error('Error fetching materias:', error);
    }
  };

  const fetchSeries = async () => {
    try {
      const { data, error } = await supabase
        .from('tbf_serie')
        .select('*')
        .order('serie', { ascending: true });

      if (error) throw error;
      setSeries(data || []);
    } catch (error) {
      console.error('Error fetching series:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tbf_controle_user')
        .select('*, tbf_serie(serie)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching all users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user: UserProfile) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleEditClick = (user: UserProfile) => {
    setUserToEdit(user);
    setEditForm({
      nome: user.nome || '',
      sobrenome: user.sobrenome || '',
      signature: user.signature || 'inativo',
      role: user.role || 'aluno',
      materias: user.materias || [],
      serie: user.serie || ''
    });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!userToEdit) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('tbf_controle_user')
        .update({
          nome: editForm.nome,
          sobrenome: editForm.sobrenome,
          signature: editForm.signature,
          role: editForm.role,
          materias: editForm.role === 'aluno' ? editForm.materias : [], // Only save materias if role is aluno
          serie: editForm.serie
        })
        .eq('id', userToEdit.id);

      if (error) throw error;

      await logAudit('update_user', userToEdit.id, { 
        old: { nome: userToEdit.nome, sobrenome: userToEdit.sobrenome, role: userToEdit.role, materias: userToEdit.materias, serie: userToEdit.serie },
        new: editForm 
      });

      const selectedSerie = series.find(s => s.id === editForm.serie);

      setUsers(users.map(u => u.id === userToEdit.id ? { 
        ...u, 
        ...editForm, 
        materias: editForm.role === 'aluno' ? editForm.materias : [],
        tbf_serie: selectedSerie ? { serie: selectedSerie.serie } : u.tbf_serie
      } : u));
      setShowEditModal(false);
      setUserToEdit(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Erro ao atualizar usuário.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMateria = (materiaId: string) => {
    setEditForm(prev => {
      const currentMaterias = prev.materias || [];
      // Use string comparison to handle mixed types (string/number)
      if (currentMaterias.some(id => String(id) === String(materiaId))) {
        return { ...prev, materias: currentMaterias.filter(id => String(id) !== String(materiaId)) };
      } else {
        return { ...prev, materias: [...currentMaterias, materiaId] };
      }
    });
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(userToDelete.id);
      
      // 1. Delete from database
      const { error: dbError } = await supabase
        .from('tbf_controle_user')
        .delete()
        .eq('id', userToDelete.id);

      if (dbError) throw dbError;

      await logAudit('delete_user', userToDelete.id, { 
        email: userToDelete.email, 
        nome: `${userToDelete.nome} ${userToDelete.sobrenome}` 
      });

      // 2. Note about Auth deletion:
      // Client-side anon key cannot delete users from Auth service.
      // This usually requires a Service Role key or an Edge Function.
      // For now, we only delete from the profile table.
      // If an Edge Function exists, we would call it here.
      
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erro ao excluir usuário. Verifique as permissões.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Helper to capitalize words
  const capitalizeWords = (str: string) => {
    if (!str) return '';
    return str
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper to format materias
  const getFormattedMaterias = (userMaterias: string[] | undefined) => {
    if (!userMaterias || userMaterias.length === 0) return '-';
    
    return userMaterias
      .map(id => {
        // Compare as strings to handle potential type mismatches (number vs string)
        const materia = materias.find(m => String(m.id) === String(id));
        return materia ? materia.materia : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  // Filtering logic
  const filteredUsers = users.filter(user => {
    // Search by name (nome + sobrenome)
    const fullName = `${user.nome} ${user.sobrenome}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());

    // Role filter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    // Signature filter
    // If showAll is true, we ignore signature filter. 
    // Otherwise, we check if user signature is in the selected filters.
    const matchesSignature = showAll || signatureFilter.includes(user.signature);

    return matchesSearch && matchesRole && matchesSignature;
  });

  // Sorting logic
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortConfig.key === 'nome') {
      aValue = `${a.nome} ${a.sobrenome}`.toLowerCase();
      bValue = `${b.nome} ${b.sobrenome}`.toLowerCase();
    } else {
      aValue = (a[sortConfig.key as keyof UserProfile] || '').toString().toLowerCase();
      bValue = (b[sortConfig.key as keyof UserProfile] || '').toString().toLowerCase();
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSignatureFilter = (val: string) => {
    setSignatureFilter(prev => 
      prev.includes(val) 
        ? prev.filter(i => i !== val) 
        : [...prev, val]
    );
  };

  const handleSearch = () => {
    setSearchQuery(tempSearchQuery);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTempSearchQuery('');
    setRoleFilter('all');
    setSignatureFilter(['ativo']);
    setShowAll(false);
    setCurrentPage(1);
    // Reset sort to default A-Z
    setSortConfig({ key: 'nome', direction: 'asc' });
  };

  const hasActiveFilters = 
    searchQuery !== '' || 
    roleFilter !== 'all' || 
    showAll !== false || 
    signatureFilter.length !== 1 || 
    signatureFilter[0] !== 'ativo';

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

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

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-[#A3AED0]">
            Tem certeza que deseja excluir o usuário <span className="font-bold text-[#1B2559]">{userToDelete?.nome} {userToDelete?.sobrenome}</span>?
            Esta ação não pode ser desfeita e removerá o acesso do usuário ao sistema.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              onClick={confirmDelete}
              isLoading={isDeleting === userToDelete?.id}
            >
              Excluir Usuário
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Usuário"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1B2559]">Nome</label>
              <input 
                type="text"
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                className="w-full px-4 py-2 bg-[#F4F7FE] border-none rounded-xl text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1B2559]">Sobrenome</label>
              <input 
                type="text"
                value={editForm.sobrenome}
                onChange={(e) => setEditForm({ ...editForm, sobrenome: e.target.value })}
                className="w-full px-4 py-2 bg-[#F4F7FE] border-none rounded-xl text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#1B2559]">E-mail (Não editável)</label>
            <input 
              type="text"
              value={userToEdit?.email || ''}
              disabled
              className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-[#A3AED0] cursor-not-allowed outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1B2559]">Assinatura</label>
              <select 
                value={editForm.signature}
                onChange={(e) => setEditForm({ ...editForm, signature: e.target.value })}
                className="w-full px-4 py-2 bg-[#F4F7FE] border-none rounded-xl text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none appearance-none"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1B2559]">Cargo</label>
              <select 
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full px-4 py-2 bg-[#F4F7FE] border-none rounded-xl text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none appearance-none"
              >
                <option value="admin">Admin</option>
                <option value="pai">Pai</option>
                <option value="aluno">Aluno</option>
              </select>
            </div>
          </div>

          {editForm.role === 'aluno' && (
             <div className="space-y-2 mt-2 pt-2 border-t border-gray-100">
               <label className="text-sm font-bold text-[#1B2559]">Matérias do Aluno</label>
               <div className="bg-[#F4F7FE] p-4 rounded-xl max-h-48 overflow-y-auto">
                  {materias.length === 0 ? (
                    <p className="text-sm text-[#A3AED0]">Nenhuma matéria cadastrada.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {materias.map((materia) => (
                        <label key={materia.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/50 p-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                             checked={editForm.materias?.map(String).includes(String(materia.id))}
                             onChange={() => toggleMateria(String(materia.id))}
                            className="w-4 h-4 rounded border-gray-300 text-[#0061FF] focus:ring-[#0061FF]"
                          />
                          <span className="text-sm font-medium text-[#2B3674]">{materia.materia}</span>
                        </label>
                      ))}
                    </div>
                  )}
               </div>
             </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#1B2559]">Série</label>
            <select
              value={editForm.serie}
              onChange={(e) => setEditForm({ ...editForm, serie: e.target.value })}
              className="w-full px-4 py-2 bg-[#F4F7FE] border-none rounded-xl text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none appearance-none"
            >
              <option value="">Selecione uma série</option>
              {series.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.serie}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleEditSave}
              isLoading={isSaving}
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
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
              <span className="hidden md:inline">Voltar ao Dashboard</span>
              <span className="md:hidden">Voltar</span>
            </button>
          </div>
          
          <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] truncate">Gerenciamento de Usuários</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4">
          <div className="max-w-[1600px] mx-auto">
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none">
              <div className="p-8 border-b border-gray-100 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#F4F7FE] text-[#0061FF] rounded-xl flex items-center justify-center">
                      <Users size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#1B2559]">Lista de Usuários</h2>
                      <p className="text-sm text-[#A3AED0]">Gerencie os acessos e permissões dos usuários</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3AED0]" />
                      <input 
                        type="text"
                        placeholder="Buscar por nome..."
                        value={tempSearchQuery}
                        onChange={(e) => setTempSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-11 pr-4 py-2.5 bg-[#F4F7FE] border-none rounded-xl text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none w-64 text-sm"
                      />
                    </div>
                    <Button variant="primary" size="sm" onClick={handleSearch}>
                      Buscar
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-8 bg-gray-50/50 p-4 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter size={16} className="text-[#A3AED0]" />
                      <span className="text-sm font-bold text-[#1B2559]">Cargo:</span>
                    </div>
                    <select 
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="bg-white border-none rounded-lg px-3 py-1.5 text-sm text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none shadow-sm font-medium"
                    >
                      <option value="all">Todos os Cargos</option>
                      <option value="admin">Admin</option>
                      <option value="pai">Pai</option>
                      <option value="aluno">Aluno</option>
                    </select>
                  </div>

                  <div className="h-6 w-px bg-gray-200"></div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Signature size={16} className="text-[#A3AED0]" />
                      <span className="text-sm font-bold text-[#1B2559]">Assinatura:</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox"
                            checked={showAll}
                            onChange={(e) => setShowAll(e.target.checked)}
                            className="peer hidden"
                          />
                          <div className="w-5 h-5 border-2 border-[#A3AED0] rounded-md peer-checked:bg-[#0061FF] peer-checked:border-[#0061FF] transition-all"></div>
                          <Plus size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" />
                        </div>
                        <span className="text-sm font-medium text-[#2B3674] group-hover:text-[#0061FF] transition-colors">Mostrar todos</span>
                      </label>

                      {!showAll && (
                        <div className="flex items-center gap-3 ml-2 border-l border-gray-200 pl-4">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox"
                              checked={signatureFilter.includes('ativo')}
                              onChange={() => toggleSignatureFilter('ativo')}
                              className="w-4 h-4 rounded border-gray-300 text-[#0061FF] focus:ring-[#0061FF]"
                            />
                            <span className="text-sm font-medium text-[#2B3674]">Ativos</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox"
                              checked={signatureFilter.includes('inativo')}
                              onChange={() => toggleSignatureFilter('inativo')}
                              className="w-4 h-4 rounded border-gray-300 text-[#0061FF] focus:ring-[#0061FF]"
                            />
                            <span className="text-sm font-medium text-[#2B3674]">Inativos</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <>
                      <div className="h-6 w-px bg-gray-200"></div>
                      <button 
                        onClick={clearFilters}
                        className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-red-50"
                      >
                        <X size={16} />
                        Limpar Filtros
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[#A3AED0] text-sm uppercase tracking-wider">
                      <th 
                        className="px-8 py-6 font-semibold cursor-pointer hover:text-[#0061FF] transition-colors group"
                        onClick={() => handleSort('nome')}
                      >
                        <div className="flex items-center gap-2">
                          Usuário
                          <div className={cn(
                            "flex flex-col opacity-0 group-hover:opacity-100 transition-opacity",
                            sortConfig.key === 'nome' && "opacity-100"
                          )}>
                            <ChevronUp size={12} className={cn(sortConfig.key === 'nome' && sortConfig.direction === 'asc' ? "text-[#0061FF]" : "text-[#CBD5E0]")} />
                            <ChevronDown size={12} className={cn(sortConfig.key === 'nome' && sortConfig.direction === 'desc' ? "text-[#0061FF]" : "text-[#CBD5E0]")} />
                          </div>
                        </div>
                      </th>
                      <th 
                        className="px-8 py-6 font-semibold cursor-pointer hover:text-[#0061FF] transition-colors group"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center gap-2">
                          E-mail
                          <div className={cn(
                            "flex flex-col opacity-0 group-hover:opacity-100 transition-opacity",
                            sortConfig.key === 'email' && "opacity-100"
                          )}>
                            <ChevronUp size={12} className={cn(sortConfig.key === 'email' && sortConfig.direction === 'asc' ? "text-[#0061FF]" : "text-[#CBD5E0]")} />
                            <ChevronDown size={12} className={cn(sortConfig.key === 'email' && sortConfig.direction === 'desc' ? "text-[#0061FF]" : "text-[#CBD5E0]")} />
                          </div>
                        </div>
                      </th>
                      <th 
                        className="px-8 py-6 font-semibold cursor-pointer hover:text-[#0061FF] transition-colors group"
                        onClick={() => handleSort('signature')}
                      >
                        <div className="flex items-center gap-2">
                          Assinatura
                          <div className={cn(
                            "flex flex-col opacity-0 group-hover:opacity-100 transition-opacity",
                            sortConfig.key === 'signature' && "opacity-100"
                          )}>
                            <ChevronUp size={12} className={cn(sortConfig.key === 'signature' && sortConfig.direction === 'asc' ? "text-[#0061FF]" : "text-[#CBD5E0]")} />
                            <ChevronDown size={12} className={cn(sortConfig.key === 'signature' && sortConfig.direction === 'desc' ? "text-[#0061FF]" : "text-[#CBD5E0]")} />
                          </div>
                        </div>
                      </th>
                      <th 
                        className="px-8 py-6 font-semibold cursor-pointer hover:text-[#0061FF] transition-colors group"
                        onClick={() => handleSort('role')}
                      >
                        <div className="flex items-center gap-2">
                          Cargo
                          <div className={cn(
                            "flex flex-col opacity-0 group-hover:opacity-100 transition-opacity",
                            sortConfig.key === 'role' && "opacity-100"
                          )}>
                            <ChevronUp size={12} className={cn(sortConfig.key === 'role' && sortConfig.direction === 'asc' ? "text-[#0061FF]" : "text-[#CBD5E0]")} />
                            <ChevronDown size={12} className={cn(sortConfig.key === 'role' && sortConfig.direction === 'desc' ? "text-[#0061FF]" : "text-[#CBD5E0]")} />
                          </div>
                        </div>
                      </th>
                      <th className="px-8 py-6 font-semibold">Matérias</th>
                      <th className="px-8 py-6 font-semibold">Série</th>
                      <th className="px-8 py-6 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Spinner size="lg" />
                            <p className="text-[#A3AED0] font-medium">Carregando usuários...</p>
                          </div>
                        </td>
                      </tr>
                    ) : sortedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center text-[#A3AED0]">
                          Nenhum usuário encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      currentUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0061FF] to-[#422AFB] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-200 uppercase">
                                {user.nome.charAt(0)}{user.sobrenome.charAt(0)}
                              </div>
                              <span className="font-bold text-[#1B2559]">
                                {capitalizeWords(`${user.nome} ${user.sobrenome}`)}
                                {user.role === 'aluno' && user.materias && user.materias.length > 0 && (
                                  <span className="ml-2 font-normal text-gray-500 text-xs">
                                    - {getFormattedMaterias(user.materias)}
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2 text-[#2B3674] font-medium">
                              <Mail size={16} className="text-[#A3AED0]" />
                              {user.email}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                              user.signature === 'ativo' 
                                ? "bg-green-100 text-green-600" 
                                : "bg-red-100 text-red-600"
                            )}>
                              {user.signature || 'Inativo'}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2 text-[#2B3674] font-medium capitalize">
                              <Shield size={16} className="text-[#A3AED0]" />
                              {user.role || 'Usuário'}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-sm font-medium text-[#2B3674]">
                              {user.role === 'aluno' ? getFormattedMaterias(user.materias) : '-'}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-sm font-medium text-[#2B3674]">
                              {user.tbf_serie?.serie || '-'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2 opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-[#A3AED0] hover:text-[#0061FF] bg-[#F4F7FE] hover:bg-[#E0E7FF] shadow-sm"
                                onClick={() => handleEditClick(user)}
                              >
                                <Edit size={18} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-[#A3AED0] hover:text-red-600 bg-red-50 hover:bg-red-100 shadow-sm"
                                onClick={() => handleDeleteClick(user)}
                              >
                                <Trash2 size={18} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {users.length > 0 && (
                <div className="p-8 border-t border-gray-100 flex justify-between items-center bg-gray-50/30">
                  <p className="text-sm text-[#A3AED0] font-medium">
                    Mostrando <span className="text-[#1B2559] font-bold">{indexOfFirstUser + 1}</span> a <span className="text-[#1B2559] font-bold">{Math.min(indexOfLastUser, users.length)}</span> de <span className="text-[#1B2559] font-bold">{users.length}</span> usuários
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="text-[#A3AED0] hover:text-[#0061FF]"
                    >
                      Anterior
                    </Button>
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i + 1}
                        variant={currentPage === i + 1 ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => paginate(i + 1)}
                        className={cn(
                          "w-10 h-10 p-0 rounded-xl font-bold transition-all",
                          currentPage === i + 1 ? "shadow-lg shadow-blue-200" : "text-[#A3AED0] hover:text-[#0061FF]"
                        )}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="text-[#A3AED0] hover:text-[#0061FF]"
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Usuarios;
