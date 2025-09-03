import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FileUpload from '@/components/FileUpload'
import { FileText } from 'lucide-react'

// Mock the auth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}))

// Mock the CRM tracking hook
vi.mock('@/hooks/use-crm-tracking', () => ({
  useCRMTracking: () => ({}),
}))

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('FileUpload Component - Fixed', () => {
  it('renders basic UI elements correctly', () => {
    const Wrapper = createTestWrapper()
    
    render(
      <FileUpload
        type="cv"
        label="Upload CV"
        description="Upload your CV document"
        icon={FileText}
      />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText('Upload CV')).toBeInTheDocument()
    expect(screen.getByText('Click to upload or drag and drop')).toBeInTheDocument()
    expect(screen.getByText('Supports PDF, DOC, DOCX (Max 5MB)')).toBeInTheDocument()
  })

  it('displays existing file correctly', () => {
    const Wrapper = createTestWrapper()
    const existingFile = { filename: 'existing-cv.pdf', id: 1 }
    
    render(
      <FileUpload
        type="cv"
        label="Upload CV"
        description="Upload your CV document"
        icon={FileText}
        existingFile={existingFile}
      />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText('existing-cv.pdf')).toBeInTheDocument()
  })
})