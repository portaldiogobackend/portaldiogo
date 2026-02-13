import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, MapPin, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/lib/searchIndex';
import { searchContent } from '@/lib/searchIndex';

// ============== Interfaces ==============
interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

// ============== Highlight Text Function ==============
function highlightSearchTerm(text: string, query: string): React.ReactNode[] {
  if (!query) return [text];
  
  const parts: React.ReactNode[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let lastIndex = 0;
  let keyIndex = 0;

  let pos = 0;
  while ((pos = lowerText.indexOf(lowerQuery, lastIndex)) !== -1) {
    // Add text before match
    if (pos > lastIndex) {
      parts.push(<span key={keyIndex++}>{text.substring(lastIndex, pos)}</span>);
    }
    // Add highlighted match
    parts.push(
      <mark 
        key={keyIndex++} 
        className="bg-yellow-300 text-[#222E48] px-0.5 rounded font-medium"
      >
        {text.substring(pos, pos + query.length)}
      </mark>
    );
    lastIndex = pos + query.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={keyIndex++}>{text.substring(lastIndex)}</span>);
  }

  return parts;
}

// ============== Navigate and Highlight Function ==============
function navigateAndHighlight(elementId: string | undefined, query: string) {
  if (!elementId) return;

  // First, scroll to the element
  const targetElement = document.getElementById(elementId);
  if (targetElement) {
    targetElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });

    // Clear any previous highlights
    const previousHighlights = document.querySelectorAll('.search-highlight');
    previousHighlights.forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
      }
    });

    // Add highlight to matching text within the section
    setTimeout(() => {
      highlightTextInElement(targetElement, query);
    }, 500);
  }
}

// ============== Highlight Text in DOM ==============
function highlightTextInElement(element: HTMLElement, query: string) {
  if (!query || query.length < 2) return;

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );

  const textNodes: Text[] = [];
  let node: Node | null;

  while ((node = walker.nextNode())) {
    if (node.textContent && node.textContent.toLowerCase().includes(query.toLowerCase())) {
      textNodes.push(node as Text);
    }
  }

  // Limit to first 5 matches to avoid performance issues
  const nodesToHighlight = textNodes.slice(0, 5);

  nodesToHighlight.forEach((textNode) => {
    const text = textNode.textContent || '';
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index !== -1) {
      const before = text.substring(0, index);
      const match = text.substring(index, index + query.length);
      const after = text.substring(index + query.length);

      const parent = textNode.parentNode;
        if (parent && !(parent as HTMLElement).classList?.contains('search-highlight')) {
        const fragment = document.createDocumentFragment();
        
        if (before) {
          fragment.appendChild(document.createTextNode(before));
        }
        
        const highlight = document.createElement('mark');
        highlight.className = 'search-highlight bg-yellow-300 text-[#222E48] px-1 py-0.5 rounded animate-pulse';
        highlight.textContent = match;
        fragment.appendChild(highlight);
        
        if (after) {
          fragment.appendChild(document.createTextNode(after));
        }
        
        parent.replaceChild(fragment, textNode);
      }
    }
  });

  // Remove highlights after 3 seconds
  setTimeout(() => {
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach((el) => {
      el.classList.remove('animate-pulse');
      el.classList.add('transition-all', 'duration-500');
      setTimeout(() => {
        const parent = el.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        }
      }, 2500);
    });
  }, 3000);
}

// ============== SearchModal Component ==============
export const SearchModal: React.FC<SearchModalProps> = ({ 
  isOpen, 
  onClose, 
  initialQuery = '' 
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>(() => (
    initialQuery.trim().length >= 2 ? searchContent(initialQuery) : []
  ));
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = useCallback(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setIsSearching(false);
    onClose();
  }, [onClose]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle click outside
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleSearchQueryChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(() => {
      setResults(searchContent(value));
      setIsSearching(false);
    }, 200);
  }, []);

  // Handle result click
  const handleResultClick = useCallback((result: SearchResult) => {
    handleClose();
    // Small delay to allow modal to close
    setTimeout(() => {
      navigateAndHighlight(result.item.elementId, searchQuery);
    }, 300);
  }, [handleClose, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search Header */}
            <div className="p-4 border-b border-[#EBECEF]">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchQueryChange(e.target.value)}
                    placeholder="Digite o que você procura..."
                    className="w-full pl-12 pr-4 py-3.5 bg-[#E8F1FF] border border-[#EBECEF] rounded-xl text-[#222E48] placeholder:text-gray-400 focus:border-[#0D6EFD] focus:bg-white focus:ring-2 focus:ring-[#0D6EFD]/20 outline-none transition-all font-medium"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0D6EFD] animate-spin" />
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-[#E8F1FF] text-gray-500 hover:text-[#0D6EFD] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search hint */}
              <p className="mt-2 text-xs text-gray-400 ml-1">
                Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">ESC</kbd> para fechar
              </p>
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto">
              {/* No query message */}
              {searchQuery.length < 2 && (
                <div className="py-16 text-center text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Digite pelo menos 2 caracteres para buscar</p>
                </div>
              )}

              {/* Loading state */}
              {isSearching && searchQuery.length >= 2 && (
                <div className="py-16 text-center text-gray-400">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-[#0D6EFD]" />
                  <p className="text-sm">Buscando...</p>
                </div>
              )}

              {/* No results */}
              {!isSearching && searchQuery.length >= 2 && results.length === 0 && (
                <div className="py-16 text-center text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base font-medium text-gray-500">Nenhum resultado encontrado</p>
                  <p className="text-sm mt-1">Tente buscar por outros termos</p>
                </div>
              )}

              {/* Results list */}
              {!isSearching && results.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                  </p>
                  
                  <div className="space-y-1">
                    {results.map((result) => (
                      <motion.button
                        key={result.item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleResultClick(result)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl",
                          "hover:bg-[#E8F1FF] transition-all duration-200",
                          "group cursor-pointer"
                        )}
                      >
                        {/* Result header */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 flex-shrink-0 bg-[#0D6EFD]/10 rounded-lg flex items-center justify-center group-hover:bg-[#0D6EFD] transition-colors">
                            <MapPin className="w-5 h-5 text-[#0D6EFD] group-hover:text-white transition-colors" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {/* Title with route info */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-[#222E48] truncate">
                                {highlightSearchTerm(result.item.titulo, searchQuery)}
                              </span>
                              <span className="px-2 py-0.5 bg-[#0D6EFD]/10 text-[#0D6EFD] text-xs font-medium rounded-full flex-shrink-0">
                                {result.occurrences} ocorrência{result.occurrences !== 1 ? 's' : ''}
                              </span>
                            </div>
                            
                            {/* Section path */}
                            <p className="text-sm text-gray-500 mb-2">
                              Página {result.item.rota} → <span className="font-medium">{result.item.secao}</span>
                            </p>
                            
                            {/* Snippets */}
                            {result.snippets.length > 0 && (
                              <div className="space-y-1">
                                {result.snippets.slice(0, 2).map((snippet, idx) => (
                                  <p 
                                    key={idx}
                                    className="text-xs text-gray-400 leading-relaxed line-clamp-1"
                                  >
                                    {highlightSearchTerm(snippet, searchQuery)}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer hint */}
            {results.length > 0 && (
              <div className="px-4 py-3 border-t border-[#EBECEF] bg-gray-50">
                <p className="text-xs text-gray-400 text-center">
                  Clique em um resultado para navegar e destacar o termo na página
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
