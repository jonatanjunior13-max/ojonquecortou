import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Filter } from 'lucide-react';
import serviceComparison from '../data/serviceComparison.json';
import './ServicePicker.css';

const ServicePicker = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConditions, setSelectedConditions] = useState([]);

  // Extract all unique condition tags
  const allConditions = useMemo(() => {
    const conditions = new Set();
    serviceComparison.services.forEach(service => {
      service.idealFor.forEach(condition => {
        conditions.add(condition);
      });
    });
    return Array.from(conditions).sort();
  }, []);

  // Filter services based on search and selected conditions
  const filteredServices = useMemo(() => {
    return serviceComparison.services.filter(service => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.bestFor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesConditions =
        selectedConditions.length === 0 ||
        selectedConditions.some(condition =>
          service.idealFor.some(ideal =>
            ideal.toLowerCase().includes(condition.toLowerCase())
          )
        );

      return matchesSearch && matchesConditions;
    });
  }, [searchTerm, selectedConditions]);

  const toggleCondition = (condition) => {
    setSelectedConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  return (
    <section className="service-picker">
      <div className="picker-header">
        <h2>Qual serviço é para mim?</h2>
        <p>Busque por sua situação capilar. Vamos te guiar para o atendimento certo.</p>
      </div>

      <div className="picker-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar serviço (corte, tratamento, coloração...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {allConditions.length > 0 && (
          <div className="conditions-filter">
            <div className="filter-label">
              <Filter size={16} />
              <span>Filtre por sua situação:</span>
            </div>
            <div className="conditions-grid">
              {allConditions.map(condition => (
                <button
                  key={condition}
                  className={`condition-tag ${selectedConditions.includes(condition) ? 'active' : ''}`}
                  onClick={() => toggleCondition(condition)}
                  title={condition}
                >
                  {condition.length > 30 ? condition.substring(0, 27) + '...' : condition}
                </button>
              ))}
            </div>
            {selectedConditions.length > 0 && (
              <button
                className="clear-filters"
                onClick={() => setSelectedConditions([])}
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      <div className="results-info">
        <p>{filteredServices.length} serviço(s) encontrado(s)</p>
      </div>

      <div className="services-grid">
        {filteredServices.length > 0 ? (
          filteredServices.map(service => (
            <article key={service.id} className="service-card">
              <div className="card-header">
                <h3>{service.name}</h3>
                <div className="card-meta">
                  <span className="duration">{service.duration}</span>
                  <span className="price">{service.price}</span>
                </div>
              </div>

              <p className="best-for">{service.bestFor}</p>

              <div className="ideal-for">
                <p className="label">Ideal para:</p>
                <ul>
                  {service.idealFor.map((condition, idx) => (
                    <li key={idx}>{condition}</li>
                  ))}
                </ul>
              </div>

              <div className="benefits">
                <p className="label">Benefícios:</p>
                <ul>
                  {service.benefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>

              <button
                className="service-cta"
                onClick={() => navigate('/agendar')}
              >
                Agendar
                <ChevronRight size={16} />
              </button>
            </article>
          ))
        ) : (
          <div className="no-results">
            <p>Nenhum serviço encontrado para sua busca.</p>
            <button
              className="reset-button"
              onClick={() => {
                setSearchTerm('');
                setSelectedConditions([]);
              }}
            >
              Resetar filtros
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ServicePicker;
