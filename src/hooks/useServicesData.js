import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';

export function useServicesData(SEED_SERVICES) {
  const [isDemoMode, setIsDemoMode] = useState(!db);
  const [loading, setLoading] = useState(!!db);
  const [packages, setPackages] = useState(() => {
    if (!db) {
       const local = localStorage.getItem('demo_packages');
       return local ? JSON.parse(local) : [];
    }
    return [];
  });

  const [services, setServices] = useState(() => {
    if (!db) {
      const localData = localStorage.getItem('demo_services');
      const dataList = localData ? JSON.parse(localData) : SEED_SERVICES;
      dataList.sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
      return dataList;
    }
    return [];
  });

  useEffect(() => {
    if (!db) {
      return;
    }

    let unsubscribe;
    try {
      unsubscribe = onSnapshot(collection(db, 'services'), (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (list.length === 0 && !localStorage.getItem('services_seeded')) {
          // Se o banco estiver vazio, semeia os dados iniciais uma única vez
          SEED_SERVICES.forEach(async (serv) => {
            await setDoc(doc(db, 'services', serv.id), serv);
          });
          localStorage.setItem('services_seeded', 'true');
        }
        list.sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
        setServices(list);
        setLoading(false);
      }, (error) => {
        console.warn('Erro ao conectar Firestore para serviços:', error);
        alert('Erro ao carregar serviços. Tente recarregar a página.');
        setLoading(false);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      console.warn('Erro na conexão do banco para serviços:', err);
      setLoading(false);
    }
  }, [SEED_SERVICES]);

  useEffect(() => {
    if (!db) {
      return;
    }
    let unsubscribe;
    try {
      unsubscribe = onSnapshot(collection(db, 'packages'), (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setPackages(list);
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      console.warn('Erro pacotes:', err);
    }
  }, []);

  return { services, setServices, packages, setPackages, loading, setLoading, isDemoMode, setIsDemoMode };
}
