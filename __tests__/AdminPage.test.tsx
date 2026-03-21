import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPage from '@/app/admin/page';

// Mock context and auth
jest.mock('@/context/app-context', () => ({
  useAppContext: () => ({
    savedJobs: [
      {
        id: '1',
        companyName: 'Test Company',
        jobTitle: 'Test Role',
        status: 'applied',
        formData: { jobDescription: '...', bio: '...' },
        allResults: { cv: '...', coverLetter: '...' },
        savedAt: new Date().toISOString(),
      }
    ],
    setSavedJobs: jest.fn(),
  }),
  useAuth: () => ({
    user: { uid: '123', email: 'test@example.com' },
  }),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Briefcase: () => <span>Briefcase</span>,
  Clock: () => <span>Clock</span>,
  ExternalLink: () => <span>ExternalLink</span>,
  FileCheck: () => <span>FileCheck</span>,
  FileText: () => <span>FileText</span>,
  Filter: () => <span>Filter</span>,
  LayoutGrid: () => <span>LayoutGrid</span>,
  List: () => <span>List</span>,
  MoreHorizontal: () => <span>MoreHorizontal</span>,
  Plus: () => <span>Plus</span>,
  Search: () => <span>Search</span>,
  Trash2: () => <span>Trash2</span>,
  ArrowRight: () => <span>ArrowRight</span>,
  Bot: () => <span>Bot</span>,
  ChevronRight: () => <span>ChevronRight</span>,
}));

// Mock components
jest.mock('@/components/ai-job-assist-logo', () => ({
  AiJobAssistLogo: () => <div>Logo</div>,
}));

jest.mock('@/components/theme-toggle-button', () => ({
  ThemeToggleButton: () => <button>Theme</button>,
}));

describe('AdminPage', () => {
  it('renders the Application Tracker title', () => {
    render(<AdminPage />);
    expect(screen.getAllByText(/Application Tracker/i).length).toBeGreaterThan(0);
  });

  it('renders the job card with correct title and company', () => {
    render(<AdminPage />);
    expect(screen.getByText('Test Role')).toBeInTheDocument();
    expect(screen.getByText('Test Company')).toBeInTheDocument();
  });

  it('renders the status badge', () => {
    render(<AdminPage />);
    // Check for the column header or the badge in the card
    expect(screen.getAllByText('Applied').length).toBeGreaterThan(0);
  });
});
