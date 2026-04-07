import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App, { validateAudioFile, SUPPORTED_AUDIO_FORMATS, SUPPORTED_EXTENSIONS } from './App';
import { ThemeProvider } from './ThemeContext';

const renderApp = () => render(<ThemeProvider><App /></ThemeProvider>);

test('renders the AI-Powered badge', () => {
  renderApp();
  expect(screen.getByText(/AI-Powered/i)).toBeInTheDocument();
});

test('renders the app title "Meet to Action"', () => {
  renderApp();
  expect(screen.getByRole('heading', { name: /Meet to Action/i })).toBeInTheDocument();
});

test('renders Text Input and Audio Upload tabs', () => {
  renderApp();
  expect(screen.getByRole('tab', { name: /Text Input/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /Audio Upload/i })).toBeInTheDocument();
});

test('text input panel is shown by default', () => {
  renderApp();
  expect(screen.getByRole('textbox', { name: /Meeting text input/i })).toBeInTheDocument();
});

test('Extract Tasks button is disabled when textarea is empty', () => {
  renderApp();
  expect(screen.getByRole('button', { name: /Extract Tasks/i })).toBeDisabled();
});

test('Extract Tasks button is enabled after typing', async () => {
  renderApp();
  const textarea = screen.getByRole('textbox', { name: /Meeting text input/i });
  await userEvent.type(textarea, 'Alice will prepare the report by Friday.');
  expect(screen.getByRole('button', { name: /Extract Tasks/i })).toBeEnabled();
});

test('switching to Audio Upload tab shows the drop zone', async () => {
  renderApp();
  await userEvent.click(screen.getByRole('tab', { name: /Audio Upload/i }));
  expect(screen.getByRole('button', { name: /Audio file drop zone/i })).toBeInTheDocument();
});

test('renders the three feature cards', () => {
  renderApp();
  expect(screen.getByText(/Smart Extraction/i)).toBeInTheDocument();
  expect(screen.getByText(/Structured Output/i)).toBeInTheDocument();
  expect(screen.getByText(/Easy Export/i)).toBeInTheDocument();
});

test('shows export dropdown options after extracting tasks', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          summary: 'Weekly sync summary',
          tasks: [{ task: 'Prepare report', owner: 'Alice', deadline: 'Friday' }],
        }),
    })
  );

  renderApp();
  const textarea = screen.getByRole('textbox', { name: /Meeting text input/i });
  await userEvent.type(textarea, 'Alice will prepare the report by Friday.');
  await userEvent.click(screen.getByRole('button', { name: /Extract Tasks/i }));

  const exportButton = await screen.findByRole('button', { name: /Export/i });
  await userEvent.click(exportButton);

  expect(screen.getByRole('menuitem', { name: /Export JSON/i })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: /Export as PDF/i })).toBeInTheDocument();
});

test('closes export dropdown on Escape key and outside click', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          summary: 'Weekly sync summary',
          tasks: [{ task: 'Prepare report', owner: 'Alice', deadline: 'Friday' }],
        }),
    })
  );

  renderApp();
  const textarea = screen.getByRole('textbox', { name: /Meeting text input/i });
  await userEvent.type(textarea, 'Alice will prepare the report by Friday.');
  await userEvent.click(screen.getByRole('button', { name: /Extract Tasks/i }));

  const exportButton = await screen.findByRole('button', { name: /Export/i });
  await userEvent.click(exportButton);
  expect(screen.getByRole('menuitem', { name: /Export JSON/i })).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('menuitem', { name: /Export JSON/i })).not.toBeInTheDocument();

  await userEvent.click(exportButton);
  expect(screen.getByRole('menuitem', { name: /Export JSON/i })).toBeInTheDocument();
  await userEvent.click(screen.getByText(/Extracted Tasks/i));
  expect(screen.queryByRole('menuitem', { name: /Export JSON/i })).not.toBeInTheDocument();
});

// --- Audio format validation tests ---

describe('validateAudioFile', () => {
  const makeFile = (name, type, size = 1024) =>
    new File(['x'.repeat(size)], name, { type });

  test('returns valid for a supported MP3 file', () => {
    const file = makeFile('meeting.mp3', 'audio/mpeg');
    expect(validateAudioFile(file)).toEqual({ valid: true, error: null });
  });

  test('returns valid for a supported WAV file', () => {
    const file = makeFile('meeting.wav', 'audio/wav');
    expect(validateAudioFile(file)).toEqual({ valid: true, error: null });
  });

  test('returns valid for a supported M4A file', () => {
    const file = makeFile('meeting.m4a', 'audio/x-m4a');
    expect(validateAudioFile(file)).toEqual({ valid: true, error: null });
  });

  test('returns valid for a supported OGG file', () => {
    const file = makeFile('meeting.ogg', 'audio/ogg');
    expect(validateAudioFile(file)).toEqual({ valid: true, error: null });
  });

  test('returns valid for a supported FLAC file', () => {
    const file = makeFile('meeting.flac', 'audio/flac');
    expect(validateAudioFile(file)).toEqual({ valid: true, error: null });
  });

  test('returns valid for a supported WebM file', () => {
    const file = makeFile('meeting.webm', 'audio/webm');
    expect(validateAudioFile(file)).toEqual({ valid: true, error: null });
  });

  test('returns error for unsupported MIME type', () => {
    const file = makeFile('meeting.mp3', 'video/mp4');
    const result = validateAudioFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/unsupported file type/i);
  });

  test('returns error for unsupported file extension', () => {
    const file = makeFile('meeting.avi', '');
    const result = validateAudioFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/unsupported file extension/i);
  });

  test('returns error when file exceeds 50 MB', () => {
    const bigSize = 51 * 1024 * 1024;
    const file = makeFile('big.mp3', 'audio/mpeg', bigSize);
    const result = validateAudioFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/too large/i);
  });

  test('returns error when no file is provided', () => {
    const result = validateAudioFile(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

test('SUPPORTED_AUDIO_FORMATS includes all required MIME types', () => {
  const required = ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/webm'];
  required.forEach(mime => {
    expect(SUPPORTED_AUDIO_FORMATS).toContain(mime);
  });
});

test('SUPPORTED_EXTENSIONS includes all required extensions', () => {
  const required = ['.mp3', '.m4a', '.aac', '.ogg', '.wav', '.flac', '.webm'];
  required.forEach(ext => {
    expect(SUPPORTED_EXTENSIONS).toContain(ext);
  });
});

test('drop zone shows all supported formats hint after switching to audio tab', async () => {
  renderApp();
  await userEvent.click(screen.getByRole('tab', { name: /Audio Upload/i }));
  const hint = screen.getByText(/or click to browse/i);
  expect(hint).toBeInTheDocument();
  expect(hint.textContent).toMatch(/MP3/i);
  expect(hint.textContent).toMatch(/M4A/i);
  expect(hint.textContent).toMatch(/AAC/i);
  expect(hint.textContent).toMatch(/OGG/i);
  expect(hint.textContent).toMatch(/WAV/i);
  expect(hint.textContent).toMatch(/FLAC/i);
  expect(hint.textContent).toMatch(/WebM/i);
});

test('theme toggle button is rendered with moon icon by default', () => {
  renderApp();
  const toggleBtn = screen.getByRole('button', { name: /Switch to dark mode/i });
  expect(toggleBtn).toBeInTheDocument();
  expect(toggleBtn.textContent).toBe('🌙');
});

test('theme toggle button switches icon when clicked', async () => {
  renderApp();
  const toggleBtn = screen.getByRole('button', { name: /Switch to dark mode/i });
  await userEvent.click(toggleBtn);
  expect(screen.getByRole('button', { name: /Switch to light mode/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Switch to light mode/i }).textContent).toBe('☀️');
});

