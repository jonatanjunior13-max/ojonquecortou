import { render, screen } from '@testing-library/react';
import Services from '../Services';

describe('Services Component', () => {
  it('renders section header text correctly', () => {
    render(<Services />);
    expect(screen.getByText('Nossas Especialidades')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /muito além de um corte/i })).toBeInTheDocument();
    expect(screen.getByText(/Serviços desenhados para realçar a curvatura natural/i)).toBeInTheDocument();
  });

  it('renders the "Corte Especializado" card', () => {
    render(<Services />);
    const heading = screen.getByRole('heading', { name: /corte especializado/i });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText(/Corte a seco ou molhado com técnica exclusiva/i)).toBeInTheDocument();
    expect(screen.getByText('A partir de')).toBeInTheDocument();
    expect(screen.getByText('R$ 190')).toBeInTheDocument();
  });

  it('renders the "Tratamento \+ Corte" card with featured tag', () => {
    render(<Services />);
    const heading = screen.getByRole('heading', { name: /tratamento \+ corte/i });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText('Mais Buscado')).toBeInTheDocument();
    expect(screen.getByText(/A experiência completa. Reposição de nutrientes alinhada ao corte perfeito/i)).toBeInTheDocument();
    expect(screen.getByText('Consulte valores')).toBeInTheDocument();
    expect(screen.getByText('Agende aqui')).toBeInTheDocument();
  });

  it('renders the "Morena Iluminada e Mechas" card', () => {
    render(<Services />);
    const heading = screen.getByRole('heading', { name: /morena iluminada e mechas/i });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText(/Técnicas exclusivas de clareamento desenhadas/i)).toBeInTheDocument();
    expect(screen.getByText('Pós-Avaliação')).toBeInTheDocument();
    expect(screen.getByText('Sob Consulta')).toBeInTheDocument();
  });

  it('renders the call to action button linking to scheduling page', () => {
    render(<Services />);
    const ctaButton = screen.getByRole('link', { name: /ver todos os serviços/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', '/agendar');
    expect(ctaButton).toHaveClass('btn', 'btn-primary');
  });

  it('contains the correct section id for smooth scrolling', () => {
    const { container } = render(<Services />);
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('id', 'servicos');
    expect(section).toHaveClass('services-section');
  });
});
