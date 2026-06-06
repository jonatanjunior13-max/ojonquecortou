const fs = require('fs');

const content = fs.readFileSync('src/components/Services.jsx', 'utf-8');
const newContent = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Scissors, Sparkles, Sun } from 'lucide-react';
import './Services.css';

const Services = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchServices() {
      try {
        if (!db) throw new Error('No db connection');
        const querySnapshot = await getDocs(collection(db, 'services'));
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setCategories(list);
        setError(false);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  return (
    <section className="services-section section-padding" id="servicos">
      <div className="container">
        <div className="section-header text-center">
          <span className="badge mx-auto">Nossas Especialidades</span>
          <h2 className="heading-lg">Muito além de um corte</h2>
          <p className="paragraph-lg max-w-lg mx-auto">
            Serviços desenhados para realçar a curvatura natural e devolver a saúde dos seus fios.
          </p>
        </div>

        {error ? (
          <div className="error-state" role="alert">
            <p>Não foi possível carregar os serviços. Tente novamente mais tarde.</p>
          </div>
        ) : (
          <div className="services-grid">
            {/* Service Card 1 */}
            <div className="service-card">
               <div className="service-icon blue-icon">
                 <Scissors size={28} />
               </div>
               <h3>Corte Especializado</h3>
               <p className="text-gray">
                 Corte a seco ou molhado com técnica exclusiva, visando a arquitetura do seu cacho. Inclui consultoria e finalização.
               </p>
               <div className="service-price">
                 <span>A partir de</span>
                 <strong>R$ 190</strong>
               </div>
            </div>

            {/* Service Card 2 */}
            <div className="service-card featured-card">
               <div className="popular-tag">Mais Buscado</div>
               <div className="service-icon magenta-icon">
                 <Sparkles size={28} />
               </div>
               <h3 className="text-white">Tratamento + Corte</h3>
               <p className="text-light-gray">
                 A experiência completa. Reposição de nutrientes alinhada ao corte perfeito, devolvendo volume e definição extremas.
               </p>
               <div className="service-price text-white">
                 <span>Consulte valores</span>
                 <strong>Agende aqui</strong>
               </div>
            </div>

            {/* Service Card 3 */}
            <div className="service-card">
               <div className="service-icon blue-icon">
                 <Sun size={28} />
               </div>
               <h3>Morena Iluminada e Mechas</h3>
               <p className="text-gray">
                 Técnicas exclusivas de clareamento desenhadas para preservar a estrutura e a saúde do seu cacho. Tons sofisticados e iluminados, criados sob medida para o seu tom de pele e estilo.
               </p>
               <div className="service-price">
                 <span>Pós-Avaliação</span>
                 <strong>Sob Consulta</strong>
               </div>
            </div>
          </div>
        )}

        <div className="services-cta text-center mt-4">
           <a href="/agendar" className="btn btn-primary" onClick={(e) => { e.preventDefault(); navigate('/agendar'); }}>
              Ver Todos os Serviços
           </a>
        </div>
      </div>
    </section>
  );
};

export default Services;
`;

fs.writeFileSync('src/components/Services.jsx', newContent);
