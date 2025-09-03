import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiRequest } from '@/lib/queryClient'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Utils', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('makes GET request with correct parameters', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ data: 'test' }),
      text: () => Promise.resolve('OK'),
    }
    mockFetch.mockResolvedValue(mockResponse)

    await apiRequest('GET', '/api/test')

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: {},
      body: undefined,
      credentials: 'include',
    })
  })

  it('makes POST request with JSON data', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ data: 'test' }),
      text: () => Promise.resolve('OK'),
    }
    mockFetch.mockResolvedValue(mockResponse)

    const testData = { name: 'test' }
    await apiRequest('POST', '/api/test', testData)

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
      credentials: 'include',
    })
  })

  it('makes POST request with FormData', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ data: 'test' }),
      text: () => Promise.resolve('OK'),
    }
    mockFetch.mockResolvedValue(mockResponse)

    const formData = new FormData()
    formData.append('file', new File(['test'], 'test.pdf'))
    
    await apiRequest('POST', '/api/upload', formData)

    expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
      method: 'POST',
      headers: {},
      body: formData,
      credentials: 'include',
    })
  })

  it('throws error for non-ok responses', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: () => Promise.resolve('Bad Request'),
    }
    mockFetch.mockResolvedValue(mockResponse)

    await expect(apiRequest('GET', '/api/error')).rejects.toThrow('400: Bad Request')
  })
})