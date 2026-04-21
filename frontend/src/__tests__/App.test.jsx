import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '../App';
import * as api from '../services/api';

jest.mock('../services/api');

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uploads CSV and displays stats from API response', async () => {
    api.uploadCsv.mockResolvedValue({
      columns: ['category', 'amount'],
      rows: [
        { category: 'Ops', amount: '12' },
        { category: 'Eng', amount: '40' }
      ]
    });

    render(<App />);
    const fileInput = screen.getByTestId('csv-input');
    const csvFile = new File(['category,amount\nOps,12'], 'sample.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [csvFile] } });
    fireEvent.click(screen.getByRole('button', { name: /upload dataset/i }));

    await waitFor(() => {
      expect(api.uploadCsv).toHaveBeenCalledTimes(1);
      expect(within(screen.getByText('Rows').closest('div')).getByText('2')).toBeInTheDocument();
    });
  });

  test('applies filter and replaces rendered rows', async () => {
    api.uploadCsv.mockResolvedValue({
      columns: ['team', 'score'],
      rows: [
        { team: 'A', score: '10' },
        { team: 'B', score: '99' }
      ]
    });

    api.filterDataset.mockResolvedValue({
      rows: [{ team: 'B', score: '99' }]
    });

    render(<App />);
    const fileInput = screen.getByTestId('csv-input');
    const csvFile = new File(['team,score\nA,10'], 'team.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [csvFile] } });
    fireEvent.click(screen.getByRole('button', { name: /upload dataset/i }));

    await waitFor(() => expect(api.uploadCsv).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/value/i), { target: { value: 'B' } });
    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    await waitFor(() => {
      expect(api.filterDataset).toHaveBeenCalledWith(
        expect.objectContaining({ column: 'team', operator: 'equals', value: 'B' })
      );
      expect(within(screen.getByText('Rows').closest('div')).getByText('1')).toBeInTheDocument();
    });
  });
});
