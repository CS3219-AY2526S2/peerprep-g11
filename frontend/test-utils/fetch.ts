export const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

interface MockJsonOptions {
  status?: number;
  headers?: HeadersInit;
}

function createJsonResponse(data: unknown, options: MockJsonOptions = {}) {
  const status = options.status ?? 200;

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: options.headers,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

export function resetFetchMock() {
  fetchMock.mockReset();
  global.fetch = fetchMock;
}

export function queueJsonResponse(data: unknown, options?: MockJsonOptions) {
  fetchMock.mockResolvedValueOnce(createJsonResponse(data, options));
}

export function queueFetchReject(error = new Error("Network error")) {
  fetchMock.mockRejectedValueOnce(error);
}

export function queueResponse(response: Response) {
  fetchMock.mockResolvedValueOnce(response);
}
