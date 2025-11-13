// src/MemeCard.jsx
import React from 'react';
import LazyImage from './LazyImage';

function MemeCard({ m, isFav, onToggleFav, onCopy, onOpen }) {
    return (
        <article
            onClick={() => onOpen(m)}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpen(m); }}
            className="p-4 bg-white rounded-xl shadow-item hover-lift hover:-translate-y-0.5 cursor-pointer"
            role="button"
            aria-label={m.name}
        >
            <LazyImage src={m.url} alt={m.name} className="meme-thumb h-40 w-full mb-3" />
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{m.name}</h3>
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleFav(m.id); }}
                    aria-label={isFav ? 'Unfavorite' : 'Favorite'}
                    className="ml-2"
                >
                    {isFav ? '❤️' : '🤍'}
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">size: {m.width}×{m.height}</p>

            <div className="mt-3 flex gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onCopy(m.url); }}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                >
                    Copy URL
                </button>
                <a
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm text-center hover:bg-gray-50"
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                >
                    Open
                </a>
            </div>
        </article>
    );
}

export default React.memo(MemeCard);
