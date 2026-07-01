import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import glossaryData from '../data/glossary.json';
import './Glossary.css';
import { ChevronDown, Search } from 'lucide-react';

const GlossaryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTerms, setExpandedTerms] = useState({});

  const filteredTerms = glossaryData.filter(item =>
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpanded = (term) => {
    setExpandedTerms(prev => ({
      ...prev,
      [term]: !prev[term]
    }));
  };

  const handleContentClick = (e) => {
    const target = e.target.closest('a');
    if (target) {
      const href = target.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault();
        navigate(href);
      }
    }
  };

  const seoTitle = 'Glossário — Studio do Jon | Termos Técnicos de Cabelo Cacheado';
  const seoDesc = 'Glossário técnico com 50+ termos sobre cabelo cacheado, crespo e ondulado. Descubra a ciência por trás de porosidade, pH, cronograma capilar e Método Leitura de Fio.';

  return (
    <main className="glossary-page">
      <SEO
        title={seoTitle}
        description={seoDesc}
        canonical="https://www.ojonquecortou.com.br/glossario"
      />

      <section className="glossary-hero">
        <h1>Glossário — Ciência do Cabelo Cacheado</h1>
        <p>Termos técnicos explicados com precisão. Sem marketing. Sem simplificação.</p>
      </section>

      <section className="glossary-search">
        <div className="search-input-wrapper">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar termo (porosidade, cronograma, cutícula...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <p className="search-result-count">
          {filteredTerms.length} de {glossaryData.length} termos encontrados
        </p>
      </section>

      <section className="glossary-terms" onClick={handleContentClick}>
        {filteredTerms.length > 0 ? (
          <div className="terms-list">
            {filteredTerms.map((item, idx) => (
              <article
                key={idx}
                className={`term-card ${expandedTerms[item.term] ? 'expanded' : ''}`}
              >
                <button
                  className="term-header"
                  onClick={() => toggleExpanded(item.term)}
                  aria-expanded={expandedTerms[item.term]}
                >
                  <h2 className="term-title">{item.term}</h2>
                  <ChevronDown size={20} className="chevron" />
                </button>

                {expandedTerms[item.term] && (
                  <div className="term-content">
                    <p className="term-definition">{item.definition}</p>
                    <p className="term-context">{item.context}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <p>Nenhum termo encontrado para "{searchTerm}".</p>
            <button
              onClick={() => setSearchTerm('')}
              className="reset-search"
            >
              Limpar busca
            </button>
          </div>
        )}
      </section>

      <section className="glossary-footer">
        <h2>Por que este glossário?</h2>
        <p>
          A maioria dos salões trata cabelo cacheado com simplificações e marketing. Aqui, cada termo
          é explicado através da biologia, da física e da química real. O Método Leitura de Fio exige
          linguagem precisa — este glossário é referência para cortes que funcionam e cronogramas que curam.
        </p>
      </section>
    </main>
  );
};

export default GlossaryPage;
