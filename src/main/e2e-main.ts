// This entry is selected only by the explicit E2E package build. Playwright cannot inject its
// Electron loader when launching a packaged executablePath, so load the harness before app code.
// Production packages continue to use index.ts and never include this module.
import '../../node_modules/playwright-core/lib/server/electron/loader.js';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import { app } from 'electron';

// In a packaged executable there is no separate app-entry argv item. Playwright's upstream loader
// removes the remote-debugging argument while removing that presumed item, so restore the switch
// before Chromium starts. This file is absent from production bundles.
app.commandLine.appendSwitch('remote-debugging-port', '0');

if (process.env.ADROUTER_E2E_WEB_FIXTURE === '1') {
  const fixtureUrl = 'https://example.com/adrouter-native-search-fixture';
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    if (String(input) === 'https://api.openai.com/v1/responses') {
      return new Response(
        JSON.stringify({
          output_text: 'Fixture search answer',
          output: [
            {
              type: 'message',
              content: [
                {
                  type: 'output_text',
                  text: 'Fixture search answer',
                  annotations: [
                    { type: 'url_citation', url: fixtureUrl, title: 'Fixture citation' },
                  ],
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }
    return originalFetch(input, init);
  };

  const require = createRequire(__filename);
  const dns = require('node:dns') as typeof import('node:dns');
  const originalLookup = dns.promises.lookup;
  dns.promises.lookup = (async (hostname, options) => {
    if (hostname === 'example.com') {
      return options && typeof options === 'object' && options.all
        ? [{ address: '93.184.216.34', family: 4 }]
        : { address: '93.184.216.34', family: 4 };
    }
    return originalLookup(hostname, options as never);
  }) as typeof dns.promises.lookup;

  const https = require('node:https') as typeof import('node:https');
  const originalRequest = https.request;
  https.request = ((url, options, callback) => {
    if (String(url) !== fixtureUrl) return originalRequest(url, options, callback);
    const request =
      new (require('node:events').EventEmitter)() as import('node:http').ClientRequest;
    request.end = (() => {
      queueMicrotask(() => {
        const body = Buffer.from(
          '<html><head><title>Fixture page</title></head><body><main><h1>Fixture page</h1><p>Fixture readable content.</p></main></body></html>'
        );
        const response = Readable.from([body]) as Readable & {
          statusCode: number;
          headers: Record<string, string>;
        };
        response.statusCode = 200;
        response.headers = {
          'content-type': 'text/html; charset=utf-8',
          'content-length': String(body.length),
        };
        callback?.(response as unknown as import('node:http').IncomingMessage);
        request.emit('close');
      });
      return request;
    }) as typeof request.end;
    request.destroy = ((error?: Error) => {
      if (error) queueMicrotask(() => request.emit('error', error));
      queueMicrotask(() => request.emit('close'));
      return request;
    }) as typeof request.destroy;
    return request;
  }) as typeof https.request;
}

void import('./index');
