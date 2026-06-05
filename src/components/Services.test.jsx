import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Services from './Services';
import { getDocs } from 'firebase/firestore';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn())
}));

// Mock firebase/firestore
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    getDocs: vi.fn(),
  };
});

// Mock firebase config
vi.mock('../config/firebase', () => ({
  db: {}
}));

describe('Services Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and does not crash when there is an error fetching services', async () => {
    // Mock getDocs to reject with an error
    getDocs.mockRejectedValue(new Error('Firestore error'));

    // Render the component
    render(<Services />);

    // Wait for the error state to be rendered
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Check if the correct error message is displayed
    expect(screen.getByText('Não foi possível carregar os serviços. Tente novamente mais tarde.')).toBeInTheDocument();
  });

  it('renders the services grid when data fetches successfully', async () => {
      // Mock successful fetch
      const mockDocs = [{
          id: '1', data: () => ({ name: 'Test Service' })
      }];
      getDocs.mockResolvedValue({
          forEach: (cb) => mockDocs.forEach(cb)
      });

      render(<Services />);

      await waitFor(() => {
          expect(screen.getByText('Corte Especializado')).toBeInTheDocument();
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
