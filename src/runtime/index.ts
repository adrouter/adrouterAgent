import type { ParentPort } from 'electron';
import {
  GUIDANCE_PROTOCOL_VERSION,
  INSTALLATION_AUTH_PROTOCOL_VERSION,
  OPERATION_BROKER_PROTOCOL_VERSION,
  WEB_REQUEST_PROTOCOL_VERSION,
} from '../shared/constants';
import type { OperationManifestV1 } from '../shared/contracts';
import {
  type RuntimeAuthResponse,
  type RuntimeEvent,
  type RuntimeGuidanceResponse,
  type RuntimeOperationResponse,
  RuntimePortMessageSchema,
  RuntimeRequestSchema,
  type RuntimeWebAction,
  type RuntimeWebProgress,
  type RuntimeWebResponse,
} from '../shared/runtime-protocol';
import { createId, now } from '../shared/security';
import { DesktopAgentSession } from './agent-session';
import type { ProtectedRouterHeaders, ProtectedRouterRequest } from './router-client';

let session: DesktopAgentSession | undefined;
let runStarted = false;
const pendingAuth = new Map<
  string,
  {
    resolve: (headers: ProtectedRouterHeaders) => void;
    reject: (error: Error) => void;
    cleanup: () => void;
  }
>();
const pendingOperations = new Map<
  string,
  {
    resolve: (result: Record<string, unknown>) => void;
    reject: (error: Error) => void;
    cleanup: () => void;
  }
>();
const pendingGuidance = new Map<
  string,
  {
    resolve: (content: string) => void;
    reject: (error: Error) => void;
    cleanup: () => void;
  }
>();
const pendingWeb = new Map<
  string,
  {
    resolve: (result: Record<string, unknown>) => void;
    reject: (error: Error) => void;
    cleanup: () => void;
  }
>();
const emit = (event: RuntimeEvent): void => {
  parentPort.postMessage({ kind: 'event', event });
};

const rejectPending = (reason: string): void => {
  for (const pending of pendingAuth.values()) {
    pending.cleanup();
    pending.reject(new Error(reason));
  }
  pendingAuth.clear();
  for (const pending of pendingOperations.values()) {
    pending.cleanup();
    pending.reject(new Error(reason));
  }
  pendingOperations.clear();
  for (const pending of pendingGuidance.values()) {
    pending.cleanup();
    pending.reject(new Error(reason));
  }
  pendingGuidance.clear();
  for (const pending of pendingWeb.values()) {
    pending.cleanup();
    pending.reject(new Error(reason));
  }
  pendingWeb.clear();
};

const crash = (error: unknown): void => {
  emit({
    type: 'runtime.crash',
    turnId: null,
    timestamp: now(),
    payload: { error: error instanceof Error ? error.message : String(error) },
  });
};

const requestProtectedHeaders = (
  request: ProtectedRouterRequest
): Promise<ProtectedRouterHeaders> => {
  if (request.signal?.aborted) return Promise.reject(request.signal.reason);
  const requestId = createId();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      parentPort.postMessage({
        kind: 'auth-cancel',
        protocolVersion: INSTALLATION_AUTH_PROTOCOL_VERSION,
        requestId,
      });
      pendingAuth.delete(requestId);
      cleanup();
      reject(new Error('The installation signing request timed out.'));
    }, 15_000);
    timeout.unref();
    const onAbort = (): void => {
      parentPort.postMessage({
        kind: 'auth-cancel',
        protocolVersion: INSTALLATION_AUTH_PROTOCOL_VERSION,
        requestId,
      });
      pendingAuth.delete(requestId);
      cleanup();
      reject(new Error('The installation signing request was cancelled.'));
    };
    const cleanup = (): void => {
      clearTimeout(timeout);
      request.signal?.removeEventListener('abort', onAbort);
    };
    pendingAuth.set(requestId, { resolve, reject, cleanup });
    request.signal?.addEventListener('abort', onAbort, { once: true });
    parentPort.postMessage({
      kind: 'auth-request',
      protocolVersion: INSTALLATION_AUTH_PROTOCOL_VERSION,
      requestId,
      method: request.method,
      path: request.path,
      ...(request.body ? { bodyBase64: Buffer.from(request.body).toString('base64') } : {}),
      ...(request.nonce ? { nonce: request.nonce } : {}),
    });
  });
};

const resolveProtectedHeaders = (response: RuntimeAuthResponse): void => {
  const pending = pendingAuth.get(response.requestId);
  if (!pending) return;
  pendingAuth.delete(response.requestId);
  pending.cleanup();
  if (!response.ok || !response.headers) {
    pending.reject(new Error(response.error ?? 'The installation signing request failed.'));
    return;
  }
  pending.resolve(response.headers);
};

const requestOperation = (
  manifest: OperationManifestV1,
  signal?: AbortSignal
): Promise<Record<string, unknown>> => {
  if (signal?.aborted) return Promise.reject(signal.reason);
  const requestId = createId();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      parentPort.postMessage({
        kind: 'operation-cancel',
        protocolVersion: OPERATION_BROKER_PROTOCOL_VERSION,
        requestId,
      });
      pendingOperations.delete(requestId);
      cleanup();
      reject(new Error('The structured operation timed out.'));
    }, 15 * 60_000);
    timeout.unref();
    const onAbort = (): void => {
      parentPort.postMessage({
        kind: 'operation-cancel',
        protocolVersion: OPERATION_BROKER_PROTOCOL_VERSION,
        requestId,
      });
      pendingOperations.delete(requestId);
      cleanup();
      reject(new Error('The structured operation was cancelled.'));
    };
    const cleanup = (): void => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
    };
    pendingOperations.set(requestId, { resolve, reject, cleanup });
    signal?.addEventListener('abort', onAbort, { once: true });
    parentPort.postMessage({
      kind: 'operation-request',
      protocolVersion: OPERATION_BROKER_PROTOCOL_VERSION,
      requestId,
      manifest,
    });
  });
};

const resolveOperation = (response: RuntimeOperationResponse): void => {
  const pending = pendingOperations.get(response.requestId);
  if (!pending) return;
  pendingOperations.delete(response.requestId);
  pending.cleanup();
  if (!response.ok || !response.result) {
    pending.reject(new Error(response.error ?? 'The structured operation failed.'));
    return;
  }
  pending.resolve(response.result);
};

const requestGuidance = (id: string, digest: string): Promise<string> => {
  const requestId = createId();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingGuidance.delete(requestId);
      cleanup();
      reject(new Error('The trusted guidance request timed out.'));
    }, 10_000);
    timeout.unref();
    const cleanup = (): void => clearTimeout(timeout);
    pendingGuidance.set(requestId, { resolve, reject, cleanup });
    parentPort.postMessage({
      kind: 'guidance-request',
      protocolVersion: GUIDANCE_PROTOCOL_VERSION,
      requestId,
      id,
      digest,
    });
  });
};

const resolveGuidance = (response: RuntimeGuidanceResponse): void => {
  const pending = pendingGuidance.get(response.requestId);
  if (!pending) return;
  pendingGuidance.delete(response.requestId);
  pending.cleanup();
  if (!response.ok || !response.content) {
    pending.reject(new Error(response.error ?? 'The trusted guidance request failed.'));
    return;
  }
  pending.resolve(response.content);
};

const requestWeb = (
  threadId: string,
  turnId: string,
  action: RuntimeWebAction,
  signal: AbortSignal | undefined,
  toolCallId: string
): Promise<Record<string, unknown>> => {
  if (signal?.aborted) return Promise.reject(signal.reason);
  const requestId = createId();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      parentPort.postMessage({
        kind: 'web-cancel',
        protocolVersion: WEB_REQUEST_PROTOCOL_VERSION,
        requestId,
      });
      pendingWeb.delete(requestId);
      cleanup();
      reject(new Error('The web request timed out.'));
    }, 35_000);
    timeout.unref();
    const onAbort = (): void => {
      parentPort.postMessage({
        kind: 'web-cancel',
        protocolVersion: WEB_REQUEST_PROTOCOL_VERSION,
        requestId,
      });
      pendingWeb.delete(requestId);
      cleanup();
      reject(new Error('The web request was cancelled.'));
    };
    const cleanup = (): void => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
    };
    pendingWeb.set(requestId, { resolve, reject, cleanup });
    signal?.addEventListener('abort', onAbort, { once: true });
    parentPort.postMessage({
      kind: 'web-request',
      protocolVersion: WEB_REQUEST_PROTOCOL_VERSION,
      requestId,
      threadId,
      turnId,
      toolCallId,
      action,
    });
  });
};

const resolveWeb = (response: RuntimeWebResponse): void => {
  const pending = pendingWeb.get(response.requestId);
  if (!pending) return;
  pendingWeb.delete(response.requestId);
  pending.cleanup();
  if (!response.ok || !response.result) {
    pending.reject(new Error(response.error ?? 'The web request failed.'));
    return;
  }
  pending.resolve(response.result);
};

const forwardWebProgress = (progress: RuntimeWebProgress): void => {
  emit({
    type: 'tool.activity',
    turnId: progress.turnId,
    timestamp: now(),
    payload: {
      recordKind: 'web-progress',
      state: 'progress',
      requestId: progress.requestId,
      toolCallId: progress.toolCallId,
      phase: progress.phase,
      provider: progress.provider,
      query: progress.query,
      completed: progress.completed,
      total: progress.total,
      ...(progress.error ? { error: progress.error } : {}),
    },
  });
};

const handleRequest = async (raw: unknown): Promise<void> => {
  const request = RuntimeRequestSchema.parse(raw);
  switch (request.type) {
    case 'start':
      if (session || runStarted) {
        throw new Error('The utility process already owns an active run.');
      }
      runStarted = true;
      session = new DesktopAgentSession(
        request,
        emit,
        requestProtectedHeaders,
        requestOperation,
        requestGuidance,
        (action, signal, toolCallId) =>
          requestWeb(request.threadId, request.turnId, action, signal, toolCallId)
      );
      void session
        .run()
        .catch(crash)
        .finally(() => {
          rejectPending('The agent runtime ended before the broker request completed.');
          session = undefined;
        });
      return;
    case 'presence-ack':
      session?.acknowledgePresence(request.taskId, request.promptId);
      return;
    case 'steer':
      session?.steer(request.input);
      return;
    case 'queue-follow-up':
      session?.queueFollowUp(request.input);
      return;
    case 'clear-queue':
      session?.clearQueue();
      return;
    case 'stop':
      session?.stop();
      return;
    case 'approval':
      if (!session?.resolveApproval(request.approvalId, request.decision)) {
        throw new Error('Approval request is no longer pending.');
      }
      return;
  }
};

const parentPort = process.parentPort as ParentPort;
parentPort.on('message', (event) => {
  const parsed = RuntimePortMessageSchema.safeParse(event.data);
  if (!parsed.success) return;
  if (parsed.data.kind === 'auth-response') {
    resolveProtectedHeaders(parsed.data);
    return;
  }
  if (parsed.data.kind === 'operation-response') {
    resolveOperation(parsed.data);
    return;
  }
  if (parsed.data.kind === 'guidance-response') {
    resolveGuidance(parsed.data);
    return;
  }
  if (parsed.data.kind === 'web-response') {
    resolveWeb(parsed.data);
    return;
  }
  if (parsed.data.kind === 'web-progress') {
    forwardWebProgress(parsed.data);
    return;
  }
  if (parsed.data.kind !== 'request') return;
  void handleRequest(parsed.data.request).catch(crash);
});
parentPort.postMessage({ kind: 'ready' });

process.on('uncaughtException', crash);
process.on('unhandledRejection', crash);
