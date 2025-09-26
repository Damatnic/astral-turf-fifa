import { vi } from 'vitest';

// Mock html-to-image
export const mockHtmlToImage = {
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mock-image-data'),
  toJpeg: vi.fn().mockResolvedValue('data:image/jpeg;base64,mock-image-data'),
  toSvg: vi.fn().mockResolvedValue('data:image/svg+xml;base64,mock-image-data'),
  toCanvas: vi.fn().mockResolvedValue(document.createElement('canvas')),
  toPixelData: vi.fn().mockResolvedValue(new Uint8ClampedArray(4)),
};

// Mock @google/genai
export const mockGoogleGenAI = {
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: vi.fn().mockReturnValue('Mock AI response'),
        },
      }),
      generateContentStream: vi.fn().mockResolvedValue({
        stream: (async function* () {
          yield { text: () => 'Mock' };
          yield { text: () => ' AI' };
          yield { text: () => ' response' };
        })(),
      }),
    }),
  })),
};

// Mock @tauri-apps/api
export const mockTauriApi = {
  invoke: vi.fn().mockResolvedValue('mock-tauri-response'),
  listen: vi.fn().mockResolvedValue(() => {}),
  emit: vi.fn().mockResolvedValue(undefined),
};

// Mock react-router-dom navigation
export const mockNavigate = vi.fn();
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
};

// Mock papaparse
export const mockPapaParse = {
  parse: vi.fn().mockReturnValue({
    data: [
      ['Name', 'Position', 'Age'],
      ['Test Player', 'MF', '25'],
    ],
    errors: [],
    meta: {
      delimiter: ',',
      linebreak: '\n',
      aborted: false,
      truncated: false,
      cursor: 100,
    },
  }),
  unparse: vi.fn().mockReturnValue('Name,Position,Age\nTest Player,MF,25'),
};

// Mock immer
export const mockImmer = {
  produce: vi.fn().mockImplementation((baseState, recipe) => {
    const draft = { ...baseState };
    recipe(draft);
    return draft;
  }),
  createDraft: vi.fn(),
  finishDraft: vi.fn(),
};

// Define module mocks for Vitest
vi.mock('html-to-image', () => mockHtmlToImage);
vi.mock('@google/genai', () => mockGoogleGenAI);
vi.mock('@tauri-apps/api', () => mockTauriApi);
vi.mock('papaparse', () => ({ default: mockPapaParse }));
vi.mock('immer', () => mockImmer);

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});
