import { lookup } from 'node:dns/promises';
import { realpath } from 'node:fs/promises';
import { request as httpsRequest } from 'node:https';
import { isIP, type LookupFunction } from 'node:net';
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';
import type { OperationManifestV1 } from '../shared/contracts';
import { OperationManifestV1Schema } from '../shared/contracts';
import { assertOperationManifest, createOperationManifest } from './operation-manifest';

export const MAX_NETWORK_RESPONSE_BYTES = 10 * 1024 * 1024;

const ipv4Parts = (address: string): number[] | undefined => {
  if (isIP(address) !== 4) return undefined;
  const parts = address.split('.').map(Number);
  return parts.length === 4 && parts.every((part) => Number.isInteger(part)) ? parts : undefined;
};

export const isPublicNetworkAddress = (address: string): boolean => {
  const ipv4 = ipv4Parts(address);
  if (ipv4) {
    const [first = 0, second = 0] = ipv4;
    return !(
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 0) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19)) ||
      (first === 198 && second === 51) ||
      (first === 203 && second === 0) ||
      first >= 224
    );
  }
  if (isIP(address) !== 6) return false;
  const normalized = address.toLowerCase();
  if (normalized.startsWith('::ffff:')) {
    return isPublicNetworkAddress(normalized.slice('::ffff:'.length));
  }
  return !(
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8:')
  );
};

const validatedUrl = (input: string): URL => {
  const url = new URL(input);
  if (url.protocol !== 'https:') throw new Error('Structured retrieval requires HTTPS.');
  if (url.username || url.password || url.hash) {
    throw new Error('Structured retrieval URLs cannot contain credentials or fragments.');
  }
  if (url.port && url.port !== '443') {
    throw new Error('Structured retrieval uses the standard HTTPS port only.');
  }
  return url;
};

const cancelled = (): Error => new Error('Web content retrieval was cancelled.');

export const createPinnedLookup =
  (pinnedAddress: string, signal?: AbortSignal): LookupFunction =>
  (_hostname, options, callback) => {
    if (signal?.aborted) {
      callback(cancelled(), undefined as never);
      return;
    }
    const family = isIP(pinnedAddress) as 4 | 6;
    if (typeof options === 'object' && options.all) {
      callback(null, [{ address: pinnedAddress, family }] as never);
      return;
    }
    callback(null, pinnedAddress, family);
  };

export const resolvePublicAddresses = async (
  hostname: string,
  signal?: AbortSignal
): Promise<string[]> => {
  if (signal?.aborted) throw cancelled();
  const lookupPromise = lookup(hostname, { all: true, verbatim: true });
  const records = signal
    ? await Promise.race([
        lookupPromise,
        new Promise<never>((_resolve, reject) => {
          const abort = (): void => reject(cancelled());
          signal.addEventListener('abort', abort, { once: true });
          void lookupPromise.then(
            () => signal.removeEventListener('abort', abort),
            () => signal.removeEventListener('abort', abort)
          );
        }),
      ])
    : await lookupPromise;
  if (signal?.aborted) throw cancelled();
  const addresses = [...new Set(records.map((record) => record.address))].sort();
  if (addresses.length === 0 || addresses.length > 16) {
    throw new Error('The retrieval host returned an invalid number of DNS addresses.');
  }
  if (!addresses.every(isPublicNetworkAddress)) {
    throw new Error('Private, local, reserved, and documentation network addresses are denied.');
  }
  return addresses;
};

export const createGitPushNetworkBinding = async (
  remoteUrl: string
): Promise<NonNullable<OperationManifestV1['network']>> => {
  const url = validatedUrl(remoteUrl);
  return {
    method: 'GIT_PUSH',
    url: url.toString(),
    host: url.hostname,
    resolvedAddresses: await resolvePublicAddresses(url.hostname),
    maxResponseBytes: 1024 * 1024,
  };
};

export const assertNetworkBindingCurrent = async (
  network: NonNullable<OperationManifestV1['network']>
): Promise<void> => {
  const currentAddresses = await resolvePublicAddresses(network.host);
  if (JSON.stringify(currentAddresses) !== JSON.stringify(network.resolvedAddresses)) {
    throw new Error('DNS changed after approval; review the network operation again.');
  }
};

export const createNetworkFetchManifest = async (input: {
  threadId: string;
  turnId: string;
  workspaceRoot: string;
  method: 'GET' | 'HEAD';
  url: string;
  maxResponseBytes?: number;
}): Promise<OperationManifestV1> => {
  const url = validatedUrl(input.url);
  const resolvedAddresses = await resolvePublicAddresses(url.hostname);
  return createOperationManifest({
    capability: 'network.fetch',
    threadId: input.threadId,
    turnId: input.turnId,
    workspace: await realpath(input.workspaceRoot),
    network: {
      method: input.method,
      url: url.toString(),
      host: url.hostname,
      resolvedAddresses,
      maxResponseBytes: Math.min(
        Math.max(input.maxResponseBytes ?? MAX_NETWORK_RESPONSE_BYTES, 1),
        MAX_NETWORK_RESPONSE_BYTES
      ),
    },
  });
};

export interface NetworkFetchResult {
  status: number;
  headers: Record<string, string>;
  body: Uint8Array;
}

export const fetchPublicHttpsResource = async (
  input: { url: string; maxResponseBytes?: number },
  signal?: AbortSignal
): Promise<NetworkFetchResult> => {
  if (signal?.aborted) throw cancelled();
  const url = validatedUrl(input.url);
  const addresses = await resolvePublicAddresses(url.hostname, signal);
  if (signal?.aborted) throw cancelled();
  const pinnedAddress = addresses[0];
  if (!pinnedAddress) throw new Error('The public retrieval address is unavailable.');
  const maxResponseBytes = Math.min(
    Math.max(input.maxResponseBytes ?? MAX_NETWORK_RESPONSE_BYTES, 1),
    MAX_NETWORK_RESPONSE_BYTES
  );
  return await new Promise<NetworkFetchResult>((resolveRequest, rejectRequest) => {
    let settled = false;
    const reject = (error: Error): void => {
      if (settled) return;
      settled = true;
      rejectRequest(error);
    };
    const resolve = (result: NetworkFetchResult): void => {
      if (settled) return;
      settled = true;
      resolveRequest(result);
    };
    const pinnedLookup = createPinnedLookup(pinnedAddress, signal);
    const request = httpsRequest(
      url,
      {
        method: 'GET',
        headers: {
          Accept: 'text/html, text/markdown, text/plain;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br, identity',
          'User-Agent': 'AdRouter-Agent/web-content',
        },
        lookup: pinnedLookup,
        servername: url.hostname,
      },
      (response) => {
        if (signal?.aborted) {
          response.destroy(cancelled());
          return;
        }
        const status = response.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          response.destroy();
          reject(new Error('Web content retrieval does not follow redirects.'));
          return;
        }
        const encoding = String(response.headers['content-encoding'] ?? 'identity').toLowerCase();
        if (!['identity', 'gzip', 'deflate', 'br'].includes(encoding)) {
          response.destroy();
          reject(new Error('Web content used an unsupported content encoding.'));
          return;
        }
        const declaredLength = Number(response.headers['content-length'] ?? 0);
        if (declaredLength > maxResponseBytes) {
          response.destroy();
          reject(new Error('Web content exceeded the 10 MiB encoded response limit.'));
          return;
        }
        const decoded =
          encoding === 'gzip'
            ? response.pipe(createGunzip())
            : encoding === 'deflate'
              ? response.pipe(createInflate())
              : encoding === 'br'
                ? response.pipe(createBrotliDecompress())
                : response;
        const chunks: Buffer[] = [];
        let encodedBytes = 0;
        let decodedBytes = 0;
        response.on('data', (chunk: Buffer) => {
          encodedBytes += chunk.length;
          if (encodedBytes > maxResponseBytes) {
            const error = new Error('Web content exceeded the 10 MiB encoded response limit.');
            response.destroy(error);
            if (decoded !== response) decoded.destroy(error);
          }
        });
        decoded.on('data', (chunk: Buffer) => {
          decodedBytes += chunk.length;
          if (decodedBytes > maxResponseBytes) {
            const error = new Error('Web content exceeded the 10 MiB decoded response limit.');
            decoded.destroy(error);
            response.destroy(error);
            return;
          }
          chunks.push(chunk);
        });
        response.once('error', reject);
        if (decoded !== response) decoded.once('error', reject);
        decoded.once('end', () => {
          if (signal?.aborted) {
            reject(cancelled());
            return;
          }
          const headers = Object.fromEntries(
            Object.entries(response.headers).flatMap(([key, value]) =>
              value === undefined ? [] : [[key, Array.isArray(value) ? value.join(', ') : value]]
            )
          );
          resolve({ status, headers, body: new Uint8Array(Buffer.concat(chunks)) });
        });
      }
    );
    const abort = (): void => {
      request.destroy(cancelled());
    };
    signal?.addEventListener('abort', abort, { once: true });
    request.once('error', reject);
    request.once('close', () => signal?.removeEventListener('abort', abort));
    request.end();
  });
};

export const fetchApprovedNetworkResource = async (
  rawManifest: unknown,
  signal?: AbortSignal
): Promise<NetworkFetchResult> => {
  const parsed = OperationManifestV1Schema.parse(rawManifest);
  const manifest = assertOperationManifest(parsed, {
    operationId: parsed.operationId,
    threadId: parsed.threadId,
    turnId: parsed.turnId,
    capability: 'network.fetch',
  });
  const network = manifest.network;
  if (!network) throw new Error('The approved network binding is unavailable.');
  if (!['GET', 'HEAD'].includes(network.method)) {
    throw new Error('The approved network method is invalid for retrieval.');
  }
  const url = validatedUrl(network.url);
  if (url.hostname !== network.host) throw new Error('The retrieval host binding changed.');
  await assertNetworkBindingCurrent(network);
  const pinnedAddress = network.resolvedAddresses[0];
  if (!pinnedAddress) throw new Error('The approved network address is unavailable.');

  return await new Promise<NetworkFetchResult>((resolveRequest, rejectRequest) => {
    const request = httpsRequest(
      url,
      {
        method: network.method,
        headers: {
          Accept: '*/*',
          'User-Agent': 'AdRouter-Agent/structured-fetch',
        },
        lookup: (_hostname, _options, callback) =>
          callback(null, pinnedAddress, isIP(pinnedAddress) as 4 | 6),
        servername: network.host,
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          response.resume();
          rejectRequest(new Error('Structured retrieval does not follow redirects.'));
          return;
        }
        const declaredLength = Number(response.headers['content-length'] ?? 0);
        if (declaredLength > network.maxResponseBytes) {
          response.destroy();
          rejectRequest(new Error('Structured retrieval exceeded its approved response limit.'));
          return;
        }
        const chunks: Buffer[] = [];
        let bytes = 0;
        response.on('data', (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > network.maxResponseBytes) {
            response.destroy(
              new Error('Structured retrieval exceeded its approved response limit.')
            );
            return;
          }
          chunks.push(chunk);
        });
        response.once('error', rejectRequest);
        response.once('end', () => {
          const headers = Object.fromEntries(
            Object.entries(response.headers).flatMap(([key, value]) =>
              value === undefined ? [] : [[key, Array.isArray(value) ? value.join(', ') : value]]
            )
          );
          resolveRequest({
            status,
            headers,
            body:
              network.method === 'HEAD' ? new Uint8Array() : new Uint8Array(Buffer.concat(chunks)),
          });
        });
      }
    );
    const abort = (): void => {
      request.destroy(new Error('Structured retrieval was cancelled.'));
    };
    signal?.addEventListener('abort', abort, { once: true });
    request.once('error', rejectRequest);
    request.once('close', () => signal?.removeEventListener('abort', abort));
    request.end();
  });
};
