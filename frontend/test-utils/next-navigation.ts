const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();
const mockBack = jest.fn();
const mockPrefetch = jest.fn();
const mockRedirect = jest.fn();

let mockParams: Record<string, string> = {};

export function useRouter() {
  return {
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
    back: mockBack,
    prefetch: mockPrefetch,
  };
}

export function useParams<T extends Record<string, string>>() {
  return mockParams as T;
}

export const redirect = mockRedirect;

export function setMockParams(nextParams: Record<string, string>) {
  mockParams = nextParams;
}

export function resetNextNavigationMocks() {
  mockPush.mockReset();
  mockReplace.mockReset();
  mockRefresh.mockReset();
  mockBack.mockReset();
  mockPrefetch.mockReset();
  mockRedirect.mockReset();
  mockParams = {};
}

export {
  mockBack,
  mockPrefetch,
  mockPush,
  mockRedirect,
  mockRefresh,
  mockReplace,
};
