import { useEffect, useRef, useState } from "react";
import axios from "axios";

/* ------------------------------------------------------------------
   SHARED GLOBAL CACHE (real shared cache across both functions)
-------------------------------------------------------------------*/
let GLOBAL_MEME_CACHE = null;

/* ------------------------------------------------------------------
   DEFAULT EXPORT — your old Apicalling(query)
   ✔ Works EXACTLY like your original code
   ✔ Returns ONLY the filtered array
-------------------------------------------------------------------*/
export default function Apicalling(query) {
    const [items, setItems] = useState([]);
    const localCache = useRef(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                // If global cache empty → fetch once
                if (!GLOBAL_MEME_CACHE) {
                    const resp = await axios.get("https://api.imgflip.com/get_memes");
                    if (
                        resp &&
                        resp.data &&
                        resp.data.success &&
                        Array.isArray(resp.data.data.memes)
                    ) {
                        GLOBAL_MEME_CACHE = resp.data.data.memes;
                    } else {
                        GLOBAL_MEME_CACHE = [];
                    }
                }

                // sync local copy
                localCache.current = GLOBAL_MEME_CACHE;

                if (cancelled) return;

                const q = (query || "").trim().toLowerCase();
                if (!q) {
                    setItems(localCache.current);
                } else {
                    setItems(
                        localCache.current.filter((m) =>
                            (m.name || "").toLowerCase().includes(q)
                        )
                    );
                }
            } catch (err) {
                console.error("Apicalling Error:", err);
                if (!cancelled) setItems([]);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [query]);

    return items;
}

/* ------------------------------------------------------------------
   NEW EXPORT — useMemes(query)
   ✔ Returns: { memes, loading, error, timeTaken, allMemes }
   ✔ Supports skeleton loading UI
   ✔ Supports suggestions
   ✔ Supports modal, favorites, result count, etc.
-------------------------------------------------------------------*/

export function useMemes(query) {
    const [memes, setMemes] = useState([]);
    const [allMemes, setAllMemes] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeTaken, setTimeTaken] = useState(null);

    useEffect(() => {
        let cancelled = false;
        let start = 0;

        async function fetchAll() {
            try {
                setError(null);
                setLoading(true);
                start = performance.now();

                // If global cache is empty → fetch from API
                if (!GLOBAL_MEME_CACHE) {
                    const resp = await axios.get("https://api.imgflip.com/get_memes");
                    if (
                        resp &&
                        resp.data &&
                        resp.data.success &&
                        Array.isArray(resp.data.data.memes)
                    ) {
                        GLOBAL_MEME_CACHE = resp.data.data.memes;
                    } else {
                        GLOBAL_MEME_CACHE = [];
                    }
                }

                if (cancelled) return;

                // full dataset (for suggestions)
                setAllMemes(GLOBAL_MEME_CACHE);

                // filter by query
                const q = (query || "").trim().toLowerCase();
                if (!q) {
                    setMemes(GLOBAL_MEME_CACHE);
                } else {
                    setMemes(
                        GLOBAL_MEME_CACHE.filter((m) =>
                            (m.name || "").toLowerCase().includes(q)
                        )
                    );
                }

                // time taken
                const elapsed = (performance.now() - start) / 1000;
                setTimeTaken(Number(elapsed.toFixed(3)));
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "API error");
                    setMemes([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchAll();
        return () => {
            cancelled = true;
        };
    }, [query]);

    return { memes, loading, error, timeTaken, allMemes };
}
