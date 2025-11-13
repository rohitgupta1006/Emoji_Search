// src/LazyImage.jsx
import React, { useEffect, useRef, useState } from 'react';

export default function LazyImage({ src, alt = '', className = '', sizes, srcSet }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setVisible(true);
                        io.disconnect();
                    }
                });
            }, { rootMargin: '300px' });
            io.observe(el);
            return () => io.disconnect();
        } else {
            setVisible(true);
        }
    }, [ref]);

    return (
        <div ref={ref} className={className} style={{ position: 'relative', overflow: 'hidden' }}>
            {!loaded && <div className="skel" style={{ position: 'absolute', inset: 0 }} />}
            {visible && (
                <img
                    src={src}
                    alt={alt}
                    srcSet={srcSet}
                    sizes={sizes}
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                    style={{ opacity: loaded ? 1 : 0, transition: 'opacity .2s ease-in' }}
                    width="100%"
                    height="auto"
                />
            )}
        </div>
    );
}
