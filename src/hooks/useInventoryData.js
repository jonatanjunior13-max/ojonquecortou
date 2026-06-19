import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export function useInventoryData(SEED_PRODUCTS) {
  // If no DB, we start directly in demo mode and not loading.
  const [isDemoMode, setIsDemoMode] = useState(!db);
  const [loading, setLoading] = useState(!!db);

  const [products, setProducts] = useState(() => {
    if (!db) {
      const localData = localStorage.getItem('demo_products');
      if (localData) return JSON.parse(localData);
      localStorage.setItem('demo_products', JSON.stringify(SEED_PRODUCTS));
      return SEED_PRODUCTS;
    }
    return [];
  });

  useEffect(() => {
    if (!db) {
      return;
    }

    let unsubscribe;
    try {
      unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
        const prodList = [];
        snapshot.forEach((doc) => {
          prodList.push({ id: doc.id, ...doc.data() });
        });
        setProducts(prodList);
        setLoading(false);
      }, (error) => {
        console.warn('Erro ao carregar Firestore:', error);
        alert('Erro ao carregar o estoque. Tente recarregar a página.');
        setLoading(false);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      console.warn('Falha na conexão com Firestore para produtos:', err);
      setLoading(false);
    }
  }, [SEED_PRODUCTS]);

  return { products, setProducts, loading, setLoading, isDemoMode };
}
