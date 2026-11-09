/* Shared by the window and search worker. Decode exact clinical JSON bytes. */
(function () {
  'use strict';
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async function (input, init) {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== location.origin ||
        !url.pathname.includes('/data/') || !url.pathname.endsWith('.json')) {
      return originalFetch(input, init);
    }
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Please use a current browser to read the clinical library.');
    }
    url.pathname += '.gz';
    const response = await originalFetch(url.href, {
      signal: request.signal,
      credentials: request.credentials
    });
    if (!response.ok) return response;
    return new Response(response.body.pipeThrough(new DecompressionStream('gzip')), {
      status: response.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  };
})();
