import React from 'react';
import SEO from '../components/SEO';
import { galleryImages } from '../data/galleryImages';
import './Gallery.css';

import { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const GalleryPage = () => {
  const [dynamicPhotos, setDynamicPhotos] = useState([]);

  useEffect(() => {
    if (!db) return;
    const loadDynamicPhotos = async () => {
      try {
        const q = query(collection(db, 'gallery_photos'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setDynamicPhotos(list);
      } catch (err) {
        console.warn('Erro ao carregar fotos dinâmicas:', err);
      }
    };
    loadDynamicPhotos();
  }, []);

  const allPhotosToShow = [
    ...dynamicPhotos.map(p => ({
      id: p.id,
      url: p.url,
      title: p.caption || 'Trabalho do Studio',
      description: p.category || 'Galeria',
      type: p.type || 'image'
    })),
    ...galleryImages.map(img => ({ ...img, type: 'image' }))
  ];

  return (
    <main className="gallery-page">
      <SEO 
        title="Cortes de Cabelos Cacheados BH | Antes e Depois | Studio do Jon" 
        description="Veja fotos reais de antes e depois de cortes de cabelos cacheados, crespos e ondulados feitos pelo especialista Jon em Belo Horizonte. Inspire-se!" 
      />
      
      <section className="gallery-hero">
        <div className="container">
          <h1 className="heading-xl reveal active">Resultados Reais</h1>
          <p className="paragraph-lg reveal active stagger-1">
            Não é mágica, é leitura de fio. Cada foto aqui é o resultado de uma análise técnica que respeita a identidade de cada curvatura.
          </p>
        </div>
      </section>

      <section className="gallery-section section-padding">
        <div className="container">
          <div className="gallery-grid">
            {allPhotosToShow.map((item, index) => (
              <div key={item.id} className={`gallery-item reveal active stagger-${(index % 4) + 1}`}>
                <div className="gallery-img-wrap">
                  {item.type === 'video' ? (
                    <video src={item.url} controls className="gallery-img" style={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }} />
                  ) : (
                    <img src={item.url} alt={`${item.title} — ${item.description} no Studio do Jon em Belo Horizonte`} className="gallery-img" />
                  )}
                  <div className="gallery-overlay">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="gallery-cta text-center reveal active mt-4">
            <h2 className="heading-lg mb-2">Pronta para sua transformação?</h2>
            <p className="paragraph-md mb-4">Seu cabelo merece um corte que entenda a linguagem dele.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/agendar" className="btn btn-primary">
                Agendar Horário
              </a>
              <a href="https://wa.me/5531983044059" target="_blank" rel="noreferrer" className="btn btn-outline">
                Falar com Especialista
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default GalleryPage;
