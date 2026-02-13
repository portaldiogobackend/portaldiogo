import { Button } from '@/components/ui/Button';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import type { ToastType } from '@/components/ui/Toast';
import { Toast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { capitalizeWords } from '@/lib/utils';
import { ArrowUpDown, Edit2, Filter, Menu, Plus, Search, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';

interface Tema {
  id: string;
  nometema: string;
  idmat: string[];
  idseries: string[];
  created_at: string;
}

interface Materia {
  id: string;
  materia: string;
}

interface Serie {
  id: string;
  serie: string;
}

const MultiSelect = <T extends { id: string }>({ 
  label, 
  items, 
  selectedIds, 
  field,
  displayProp,
  onToggle
}: { 
  label: string, 
  items: T[], 
  selectedIds: string[], 
  field: 'idmat' | 'idseries',
  displayProp: keyof T & string,
  onToggle: (id: string, field: 'idmat' | 'idseries') => void
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div className="border border-gray-200 rounded-xl p-4 max-h-40 overflow-y-auto space-y-2 bg-gray-50">
      {items.length === 0 ? (
         <p className="text-sm text-gray-400">Nenhum item disponível</p>
      ) : (
        items.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`${field}-${item.id}`}
              checked={selectedIds.includes(item.id)}
              onChange={() => onToggle(item.id, field)}
              className="w-4 h-4 text-[#4318FF] border-gray-300 rounded focus:ring-[#4318FF]"
            />
            <label htmlFor={`${field}-${item.id}`} className="text-sm text-gray-700 cursor-pointer select-none">
              {String(item[displayProp])}
            </label>
          </div>
        ))
      )}
    </div>
    <p className="text-xs text-gray-500">{selectedIds.length} selecionado(s)</p>
  </div>
);

export const Temas: React.FC = () => {
  const [temas, setTemas] = useState<Tema[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Filters and Sorting
  const [filterMateria, setFilterMateria] = useState<string>('');
  const [filterSerie, setFilterSerie] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentTema, setCurrentTema] = useState<Tema | null>(null);
  const [formData, setFormData] = useState({
    nometema: '',
    idmat: [] as string[],
    idseries: [] as string[]
  });
  const [saving, setSaving] = useState(false);

  // Layout States
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userName, setUserName] = useState<string>('Admin');

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Temas
      const { data: temasData, error: temasError } = await supabase
        .from('tbf_temas')
        .select('*')
        .order('nometema');
      if (temasError) throw temasError;
      setTemas(temasData || []);

      // Fetch Materias
      const { data: materiasData, error: materiasError } = await supabase
        .from('tbf_materias')
        .select('id, materia')
        .order('materia');
      if (materiasError) throw materiasError;
      setMaterias(materiasData || []);

      // Fetch Series
      const { data: seriesData, error: seriesError } = await supabase
        .from('tbf_serie')
        .select('id, serie');
        
      if (seriesError) throw seriesError;
      
      // Sort Series manually based on SERIES_ORDER
      const sortedSeries = (seriesData || []).sort((a, b) => {
        const indexA = SERIES_ORDER.indexOf(a.serie);
        const indexB = SERIES_ORDER.indexOf(b.serie);
        
        // Handle items not in the list (put them at the end)
        if (indexA === -1 && indexB === -1) return a.serie.localeCompare(b.serie);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
      });
      
      setSeries(sortedSeries);

      // Fetch User Info
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('tbf_controle_user')
          .select('nome')
          .eq('id', user.id)
          .single();
        if (userData) {
          setUserName(capitalizeWords(userData.nome.split(' ')[0]));
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Erro ao carregar dados.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (tema?: Tema) => {
    if (tema) {
      setCurrentTema(tema);
      setFormData({
        nometema: tema.nometema,
        idmat: tema.idmat || [],
        idseries: tema.idseries || []
      });
    } else {
      setCurrentTema(null);
      setFormData({
        nometema: '',
        idmat: [],
        idseries: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nometema.trim()) {
      showToast('O nome do tema é obrigatório.', 'error');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        nometema: formData.nometema,
        idmat: formData.idmat,
        idseries: formData.idseries
      };

      if (currentTema) {
        const { error } = await supabase
          .from('tbf_temas')
          .update(dataToSave)
          .eq('id', currentTema.id);
        if (error) throw error;
        showToast('Tema atualizado com sucesso!', 'success');
      } else {
        const { error } = await supabase
          .from('tbf_temas')
          .insert([dataToSave]);
        if (error) throw error;
        showToast('Tema criado com sucesso!', 'success');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving tema:', error);
      showToast('Erro ao salvar tema.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentTema) return;
    try {
      const { error } = await supabase
        .from('tbf_temas')
        .delete()
        .eq('id', currentTema.id);
      
      if (error) throw error;
      
      showToast('Tema excluído com sucesso!', 'success');
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting tema:', error);
      showToast('Erro ao excluir tema.', 'error');
    }
  };

  const toggleSelection = (id: string, field: 'idmat' | 'idseries') => {
    setFormData(prev => {
      const current = prev[field];
      const exists = current.includes(id);
      if (exists) {
        return { ...prev, [field]: current.filter(item => item !== id) };
      } else {
        return { ...prev, [field]: [...current, id] };
      }
    });
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const hasActiveFilters = filterMateria || filterSerie || searchTerm;

  const clearAllFilters = () => {
    setFilterMateria('');
    setFilterSerie('');
    setSearchTerm('');
    setSortConfig(null);
  };

  const filteredTemas = temas.filter(tema => {
    const nometema = tema.nometema || '';
    const matchesSearch = nometema.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMateria = filterMateria ? tema.idmat?.includes(filterMateria) : true;
    const matchesSerie = filterSerie ? tema.idseries?.includes(filterSerie) : true;
    return matchesSearch && matchesMateria && matchesSerie;
  }).sort((a, b) => {
    if (!sortConfig) return 0;
    
    if (sortConfig.key === 'nometema') {
      const nameA = a.nometema || '';
      const nameB = b.nometema || '';
      return sortConfig.direction === 'asc' 
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    }

    if (sortConfig.key === 'materias') {
      const matA = getNamesFromIds(a.idmat, materias, 'materia');
      const matB = getNamesFromIds(b.idmat, materias, 'materia');
      return sortConfig.direction === 'asc'
        ? matA.localeCompare(matB)
        : matB.localeCompare(matA);
    }

    if (sortConfig.key === 'series') {
      const serA = getNamesFromIds(a.idseries, series, 'serie');
      const serB = getNamesFromIds(b.idseries, series, 'serie');
      return sortConfig.direction === 'asc'
        ? serA.localeCompare(serB)
        : serB.localeCompare(serA);
    }
    
    return 0;
  });

  const getNamesFromIds = <T extends { id: string }>(ids: string[], source: T[], displayProp: keyof T & string) => {
    if (!ids || ids.length === 0) return '-';
    return ids
      .map(id => source.find(item => item.id === id)?.[displayProp])
      .filter(Boolean)
      .map(value => String(value))
      .join(', ');
  };

  const SERIES_ORDER = [
  'Quinto Ano Fundamental',
  'Sexto Ano Fundamental',
  'Sétimo Ano Fundamental',
  'Oitavo Ano Fundamental',
  'Nono Ano Fundamental',
  'Primeiro Ano Ensino Médio',
  'Segundo Ano Ensino Médio',
  'Terceiro Ano Ensino Médio',
  'Outros'
];

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans text-[#2B3674]">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        userName={userName}
        loading={false}
        onLogoutClick={() => {}} // Handle logout globally or pass prop
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <header className="min-h-[80px] md:h-24 flex items-center justify-between px-4 md:px-10 py-4 gap-4 bg-[#F4F7FE] md:bg-transparent z-10">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-[#1B2559] p-2 hover:bg-white/50 rounded-lg transition-colors"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] truncate">
              Gerenciamento de Temas
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar temas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full bg-white border-none shadow-sm text-sm focus:ring-2 focus:ring-[#4318FF] w-64"
              />
            </div>
            <Button onClick={() => handleOpenModal()} className="bg-[#4318FF] hover:bg-[#3311CC]">
              <Plus size={18} className="mr-2" />
              Novo Tema
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4">
          <div className="max-w-[1600px] mx-auto">
            {/* Filters Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Filter size={18} className="text-[#4318FF]" />
                  <span>Filtros:</span>
                </div>

                {/* Search on Mobile */}
                <div className="relative md:hidden w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar temas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-[#4318FF] focus:border-transparent w-full"
                  />
                </div>

                {/* Matéria Filter */}
                <div className="relative">
                  <select
                    value={filterMateria}
                    onChange={(e) => setFilterMateria(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-[#4318FF] focus:border-transparent cursor-pointer min-w-[180px]"
                  >
                    <option value="">Todas as Matérias</option>
                    {materias.map(mat => (
                      <option key={mat.id} value={mat.id}>{mat.materia}</option>
                    ))}
                  </select>
                  <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Série Filter */}
                <div className="relative">
                  <select
                    value={filterSerie}
                    onChange={(e) => setFilterSerie(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-[#4318FF] focus:border-transparent cursor-pointer min-w-[200px]"
                  >
                    <option value="">Todas as Séries</option>
                    {series.map(ser => (
                      <option key={ser.id} value={ser.id}>{ser.serie}</option>
                    ))}
                  </select>
                  <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={16} />
                    Limpar Filtros
                  </button>
                )}

                {/* Results count */}
                <div className="ml-auto text-sm text-gray-500">
                  {filteredTemas.length} de {temas.length} tema(s)
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th 
                          className="text-left py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-[#4318FF] transition-colors group"
                          onClick={() => handleSort('nometema')}
                        >
                          <div className="flex items-center gap-1">
                            Tema
                            <ArrowUpDown size={14} className={`opacity-0 group-hover:opacity-100 ${sortConfig?.key === 'nometema' ? 'opacity-100 text-[#4318FF]' : ''}`} />
                          </div>
                        </th>
                        <th 
                          className="text-center py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-[#4318FF] transition-colors group"
                          onClick={() => handleSort('materias')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Matérias
                            <ArrowUpDown size={14} className={`opacity-0 group-hover:opacity-100 ${sortConfig?.key === 'materias' ? 'opacity-100 text-[#4318FF]' : ''}`} />
                          </div>
                        </th>
                        <th 
                          className="text-center py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-[#4318FF] transition-colors group"
                          onClick={() => handleSort('series')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Séries
                            <ArrowUpDown size={14} className={`opacity-0 group-hover:opacity-100 ${sortConfig?.key === 'series' ? 'opacity-100 text-[#4318FF]' : ''}`} />
                          </div>
                        </th>
                        <th className="text-right py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTemas.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-gray-500">
                            Nenhum tema encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredTemas.map((tema) => (
                          <tr key={tema.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors last:border-0">
                            <td className="py-4 px-4">
                              <span className="font-semibold text-[#2B3674]">{tema.nometema}</span>
                            </td>
                            <td className="py-4 px-4 text-center max-w-xs truncate" title={getNamesFromIds(tema.idmat, materias, 'materia')}>
                              <span className="text-sm text-gray-600">
                                {getNamesFromIds(tema.idmat, materias, 'materia')}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center max-w-xs truncate" title={getNamesFromIds(tema.idseries, series, 'serie')}>
                              <span className="text-sm text-gray-600">
                                {getNamesFromIds(tema.idseries, series, 'serie')}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenModal(tema)}
                                  className="p-2 text-gray-400 hover:text-[#4318FF] hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setCurrentTema(tema);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentTema ? 'Editar Tema' : 'Novo Tema'}
      >
        <div className="space-y-6">
          <Input
            label="Nome do Tema"
            value={formData.nometema}
            onChange={(e) => setFormData({ ...formData, nometema: e.target.value })}
            placeholder="Digite o nome do tema"
            maxLength={250}
          />

          <MultiSelect 
            label="Séries" 
            items={series} 
            selectedIds={formData.idseries} 
            field="idseries" 
            displayProp="serie"
            onToggle={toggleSelection}
          />

          <MultiSelect 
            label="Matérias" 
            items={materias} 
            selectedIds={formData.idmat} 
            field="idmat" 
            displayProp="materia"
            onToggle={toggleSelection}
          />

          <div className="flex gap-4 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-[#4318FF] hover:bg-[#3311CC]"
              isLoading={saving}
            >
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Tema"
        message={`Tem certeza que deseja excluir o tema "${currentTema?.nometema}"? Esta ação não pode ser desfeita.`}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
