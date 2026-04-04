import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders the AI-Powered badge', () => {
  render(<App />);
  expect(screen.getByText(/AI-Powered/i)).toBeInTheDocument();
});

test('renders the app title "Meet to Action"', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Meet to Action/i })).toBeInTheDocument();
});

test('renders Text Input and Audio Upload tabs', () => {
  render(<App />);
  expect(screen.getByRole('tab', { name: /Text Input/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /Audio Upload/i })).toBeInTheDocument();
});

test('text input panel is shown by default', () => {
  render(<App />);
  expect(screen.getByRole('textbox', { name: /Meeting text input/i })).toBeInTheDocument();
});

test('Extract Tasks button is disabled when textarea is empty', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /Extract Tasks/i })).toBeDisabled();
});

test('Extract Tasks button is enabled after typing', async () => {
  render(<App />);
  const textarea = screen.getByRole('textbox', { name: /Meeting text input/i });
  await userEvent.type(textarea, 'Alice will prepare the report by Friday.');
  expect(screen.getByRole('button', { name: /Extract Tasks/i })).toBeEnabled();
});

test('switching to Audio Upload tab shows the drop zone', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('tab', { name: /Audio Upload/i }));
  expect(screen.getByRole('button', { name: /Audio file drop zone/i })).toBeInTheDocument();
});

test('renders the three feature cards', () => {
  render(<App />);
  expect(screen.getByText(/Smart Extraction/i)).toBeInTheDocument();
  expect(screen.getByText(/Structured Output/i)).toBeInTheDocument();
  expect(screen.getByText(/Easy Export/i)).toBeInTheDocument();
});

