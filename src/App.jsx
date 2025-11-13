// src/App.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMemes } from './Apicalling';
import MemeCard from './MemeCard';
import './index.css';

export default function App() {
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const typingRef = useRef(null);

  const [modalItem, setModalItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fav_memes') || '[]'); } catch { return []; }
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsList, setSuggestionsList] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const { memes, loading, error, timeTaken, allMemes } = useMemes(term);

  const status = loading ? 'Loading…' : error ? `Error: ${error}` : (!term ? 'Start typing to search.' : (memes.length === 0 ? 'No results found.' : ''));

  useEffect(() => {
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => setTerm(query.trim()), 360);
    return () => clearTimeout(typingRef.current);
  }, [query]);

  useEffect(() => {
    if (!allMemes) return;
    const pool = allMemes.slice(0, 40).flatMap(m => (m.name || '').split(/\s+/));
    const freq = {};
    pool.forEach(w => {
      const ww = w.toLowerCase().replace(/[^\w-]/g, '');
      if (!ww) return;
      freq[ww] = (freq[ww] || 0) + 1;
    });
    setSuggestionsList(Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 10));
  }, [allMemes]);

  function showToast(msg) {
    setToast(msg);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(null), 900);
  }

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { localStorage.setItem('fav_memes', JSON.stringify(next)); } catch { }
      return next;
    });
    showToast('Updated favorites');
  }, []);

  const copyText = useCallback((text) => {
    if (!navigator.clipboard) return showToast('Clipboard not available');
    navigator.clipboard.writeText(text).then(() => showToast('Copied')).catch(() => showToast('Copy failed'));
  }, []);

  function handleKeyDown(e) {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedSuggestionIndex(i => Math.min(i + 1, suggestionsList.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedSuggestionIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      if (selectedSuggestionIndex >= 0) {
        const s = suggestionsList[selectedSuggestionIndex];
        setQuery(s); setTerm(s); setShowSuggestions(false); setSelectedSuggestionIndex(-1);
      } else { setTerm(query.trim()); setShowSuggestions(false); }
    } else if (e.key === 'Escape') { setShowSuggestions(false); setSelectedSuggestionIndex(-1); }
  }

  // limit skeletons to 6 to reduce work
  const skeletonCount = 6;

  // small favorites view handler
  function showFavoritesView() {
    if (!favorites.length) return showToast('No favorites yet');
    setQuery('__FAVS__'); setTerm('__FAVS__');
  }

  const isFavoritesView = term === '__FAVS__';

  return (
    <div className="min-h-screen py-10 px-4 flex justify-center items-start bg-gradient-to-b from-white to-slate-50">
      <div className="w-full max-w-6xl">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Emoji Search</h1>
              <p className="text-sm text-gray-600 mt-1">Meme template search (Imgflip)</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={showFavoritesView} className="px-3 py-2 rounded-md border text-sm">❤️ Favorites</button>
            </div>
          </div>

          <div className="mt-2">
            <div className="relative max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <input
                  value={query === '__FAVS__' ? '' : query}
                  onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); setSelectedSuggestionIndex(-1); }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                  placeholder="Search memes by name"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-4 focus:ring-blue-100 focus:outline-none"
                />
                <button onClick={() => { setTerm(query.trim()); setShowSuggestions(false); }} className="px-4 py-2 rounded-xl bg-indigo-600 text-white">Search</button>
              </div>

              {showSuggestions && suggestionsList.length > 0 && (
                <ul className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow z-40">
                  {suggestionsList.map((s, i) => (
                    <li key={s + i} onMouseDown={(ev) => { ev.preventDefault(); setQuery(s); setTerm(s); setShowSuggestions(false); }} className={`px-4 py-2 cursor-pointer ${selectedSuggestionIndex === i ? 'bg-gray-100' : ''}`}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">{status}</div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: skeletonCount }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl bg-white skel" style={{ minHeight: 200 }} />
              ))
            ) : isFavoritesView ? (
              (allMemes || []).filter(m => favorites.includes(m.id)).map(m => (
                <MemeCard key={m.id} m={m} isFav={favorites.includes(m.id)} onToggleFav={toggleFavorite} onCopy={copyText} onOpen={setModalItem} />
              ))
            ) : (
              (memes || []).map(m => (
                <MemeCard key={m.id} m={m} isFav={favorites.includes(m.id)} onToggleFav={toggleFavorite} onCopy={copyText} onOpen={setModalItem} />
              ))
            )}
          </div>

          {memes && memes.length > 0 && !isFavoritesView && (
            <p className="mt-6 text-center text-sm text-gray-600">About <strong>{memes.length}</strong> results {timeTaken && `(${timeTaken}s)`}</p>
          )}
        </div>
      </div>

      {/* modal */}
      {modalItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{modalItem.name}</h2>
              <button onClick={() => setModalItem(null)} className="text-gray-600 hover:text-gray-900">Close</button>
            </div>
            <img src={modalItem.url} alt={modalItem.name} className="max-h-[70vh] w-full object-contain" />
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 right-6">
          <div className="px-4 py-2 bg-gray-900 text-white rounded-md shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}
