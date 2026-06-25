import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { db } from '../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './ProductsPage.css';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      const validProducts = list.filter(p => p.name && p.sellingPrice);
      setProducts(validProducts);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar produtos:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <main className="products-page">
      <SEO 
        title="Produtos Profissionais para Cachos BH | Studio do Jon" 
        description="Encontre os melhores produtos para cabelos cacheados, crespos e ondulados. Compre ou retire no Studio do Jon no Caiçara, BH." 
      />
      
      <section className="products-hero section-padding">
        <div className="container text-center">
          <h1 className="heading-xl">Nossos <span className="text-gradient">Produtos</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto">
            Produtos profissionais selecionados a dedo para a manutenção do seu cacho em casa.
          </p>
        </div>
      </section>

      <section className="products-grid-section section-padding">
        <div className="container">
          {loading ? (
            <div className="text-center" style={{ padding: '60px 0', color: 'var(--adm-gold)' }}>Carregando catálogo...</div>
          ) : products.length === 0 ? (
            <div className="text-center" style={{ padding: '60px 0', color: 'var(--adm-muted)' }}>Nenhum produto disponível no momento.</div>
          ) : (
            <div className="products-grid">
              {products.map((p) => {
                const isOutOfStock = p.quantity <= 0;
                return (
                  <div key={p.id} className="product-card">
                    <div className="product-image-container">
                      <img src={p.image || '/logo-cabeleireiro-de-cachos.png'} alt={p.name} className="product-img" />
                      {isOutOfStock && <span className="badge out-of-stock">Esgotado</span>}
                    </div>
                    <div className="product-info">
                      <span className="product-category">{p.category || 'Cuidados'}</span>
                      <h3 className="product-title">{p.name}</h3>
                      <div className="product-footer">
                        <span className="product-price">R$ {Number(p.sellingPrice).toFixed(2).replace('.', ',')}</span>
                        <Link to={`/produtos/${p.id}`} className="btn btn-accent btn-small">Ver Detalhes</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default ProductsPage;
