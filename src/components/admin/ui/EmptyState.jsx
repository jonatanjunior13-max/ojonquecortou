import React from 'react';
import './EmptyState.css';
import { Scissors } from 'lucide-react';

const EmptyState = ({ icon: Icon = Scissors, message = 'Nenhum resultado encontrado.', action }) => (
  <div className="adm-empty">
    <Icon className="adm-empty-icon" size={36} />
    <p className="adm-empty-message">{message}</p>
    {action}
  </div>
);

export default EmptyState;
