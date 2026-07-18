import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import './ProductDetailPage.css';

const WA_NUMBER = '5531920066790';
const WA_BASE = `https://wa.me/${WA_NUMBER}?text=`;

const ProductDetailPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error("Erro ao carregar detalhe do produto:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <main className="product-detail-page text-center" style={{ padding: '100px 0' }}>
        <div className="container">
          <div style={{ color: 'var(--adm-gold)' }}>Carregando produto...</div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product-detail-page error-page">
        <SEO 
          title="Produto Não Encontrado | Studio do Jon" 
          description="O produto procurado não foi localizado. Veja todos os nossos produtos profissionais de cacho no Studio do Jon BH."
        />
        <section className="product-hero section-padding text-center">
          <div className="container">
            <span className="error-emoji" style={{ fontSize: '3rem' }}>🧐</span>
            <h1 className="heading-xl mt-2">Produto não encontrado</h1>
            <p className="paragraph-lg max-w-sm mx-auto mt-2">
              Não conseguimos localizar o produto selecionado no momento.
            </p>
            <div style={{ marginTop: '24px' }}>
              <Link to="/produtos" className="btn btn-primary">Ver Todos os Produtos</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const priceVal = Number(product.sellingPrice).toFixed(2);
  const formattedPrice = priceVal.replace('.', ',');
  const isOutOfStock = product.quantity <= 0;

  const wacLink = WA_BASE + encodeURIComponent(`Olá Jon! Gostaria de reservar o produto: ${product.name} (R$ ${formattedPrice}).`);

  return (
    <main className="product-detail-page">
      <SEO
        title={`${product.name} | Studio do Jon`} 
        description={`Adquira ${product.name} no Studio do Jon. Especialista em cabelos cacheados e crespos em Belo Horizonte.`}
        image={product.image}
      />
      
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "image": product.image || 'https://www.ojonquecortou.com.br/logo-cabeleireiro-de-cachos.png',
          "description": `Adquira ${product.name} no Studio do Jon. Especialista em cabelos cacheados em Belo Horizonte.`,
          "brand": {
            "@type": "Brand",
            "name": "Studio do Jon"
          },
          "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "BRL",
            "price": priceVal,
            "itemCondition": "https://schema.org/NewCondition",
            "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            "valueAddedTaxIncluded": "true"
          }
        })}
      </script>

      <section className="product-detail-section section-padding">
        <div className="container">
          <div style={{ marginBottom: '24px' }}>
            <Link to="/produtos" style={{ color: 'var(--color-gold, #cda880)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
              ← Voltar para Produtos
            </Link>
          </div>

          <div className="product-detail-grid">
            <div className="product-detail-image-wrapper">
              <div className="product-detail-image-container">
                <img src={product.image || '/logo-cabeleireiro-de-cachos.png'} alt={product.name} className="product-detail-img" />
                {isOutOfStock && <span className="badge out-of-stock-large">Esgotado</span>}
              </div>
            </div>

            <div className="product-detail-info">
              <span className="product-detail-category">{product.category || 'Cuidados'}</span>
              <h1 className="heading-lg product-detail-title">{product.name}</h1>
              
              <div className="product-detail-price-box">
                <span className="price-label">Preço</span>
                <span className="price-value">R$ {formattedPrice}</span>
              </div>

              <div className="product-detail-description">
                <h3>Descrição do Produto</h3>
                <p>
                  Esse é um produto profissional de alta performance, recomendado e utilizado no Studio do Jon.
                  Ideal para a manutenção diária, finalização perfeita ou tratamento intensivo de cabelos ondulados, cacheados e crespos.
                </p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--adm-muted)' }}>Status de Estoque:</span>
                  <span className={`status-tag ${isOutOfStock ? 'indisponivel' : 'disponivel'}`}>
                    {isOutOfStock ? 'Temporariamente Esgotado' : 'Disponível no Studio'}
                  </span>
                </div>
              </div>

              <div className="product-detail-actions">
                <a href={wacLink} target="_blank" rel="noopener noreferrer" className="btn btn-accent btn-large">
                  Reservar no WhatsApp
                </a>
                <Link to="/agendar" className="btn btn-outline btn-large">
                  Agendar Atendimento
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ProductDetailPage;
