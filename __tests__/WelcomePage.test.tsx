import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WelcomePage from '@/app/page';

// Mock the auth context
jest.mock('@/context/app-context', () => ({
  useAuth: () => ({
    user: null,
    authLoading: false,
    logout: jest.fn(),
  }),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Sparkles: () => <span>Sparkles</span>,
  ScanText: () => <span>ScanText</span>,
  UserRoundCheck: () => <span>UserRoundCheck</span>,
  Rocket: () => <span>Rocket</span>,
  User: () => <span>User</span>,
  Loader2: () => <span>Loader2</span>,
  LogOut: () => <span>LogOut</span>,
}));

// Mock the Logo component
jest.mock('@/components/ai-job-assist-logo', () => ({
  AiJobAssistLogo: () => <div>Logo</div>,
}));

// Mock ThemeToggle
jest.mock('@/components/theme-toggle-button', () => ({
  ThemeToggleButton: () => <button>Theme</button>,
}));

describe('WelcomePage', () => {
  it('renders the main heading', () => {
    render(<WelcomePage />);
    expect(screen.getByText(/Your AI Advantage in the/i)).toBeInTheDocument();
  });

  it('renders the "Build Your Application Now" button', () => {
    render(<WelcomePage />);
    const button = screen.getByRole('link', { name: /Build Your Application Now/i });
    expect(button).toBeInTheDocument();
  });

  it('shows the steps section', () => {
    render(<WelcomePage />);
    expect(screen.getByText(/1. Extract & Build/i)).toBeInTheDocument();
    expect(screen.getByText(/2. Analyze the Role/i)).toBeInTheDocument();
    expect(screen.getByText(/3. Generate & Win/i)).toBeInTheDocument();
  });
});
