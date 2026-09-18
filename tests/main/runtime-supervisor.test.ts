import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { WebContents } from 'electron';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppDatabase } from '@/main/database';
import { EventSubscriptions } from '@/main/ipc';
import { RuntimeSupervisor } from '@/main/runtime-supervisor';
import type { WebSearchService } from '@/main/web-search-service';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('runtime supervision boundaries', () => {
  it('binds native web requests to the current task and immutable network policy', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'adrouter-supervisor-web-'));
    directories.push(directory);
    const database = new AppDatabase(join(directory, 'agent.sqlite'));
    const project = database.createProject({
      path: '/tmp/project',
      displayName: 'project',
      instructions: '',
      permissionMode: 'read-only',
      git: null,
    });
    const thread = database.createThread({
      projectId: project.id,
      title: 'Task',
      model: 'auto',
      thinkingLevel: 'medium',
    });
    const turn = database.createTurn(thread.id, 'Task');
    const execute = vi.fn().mockResolvedValue({
      queries: [
        {
          query: 'current information',
          provider: 'openai',
          answer: '',
          results: [],
          error: null,
        },
      ],
      content: [],
    });
    const service = { execute, cancel: vi.fn() } as unknown as WebSearchService;
    const supervisor = new RuntimeSupervisor(
      database,
      '/tmp/runtime.js',
      vi.fn(),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      service
    );
    const postMessage = vi.fn();
    const active = {
      threadId: thread.id,
      turnId: turn.id,
      child: { postMessage },
      closing: false,
      exited: false,
      ready: Promise.resolve(),
      markReady: vi.fn(),
      authMode: 'custom',
      authControllers: new Map(),
      operationControllers: new Map(),
      webControllers: new Map(),
      usedWebRequestIds: new Set(),
      guidanceRequests: new Set(),
    };
    const activeMap = (supervisor as unknown as { active: Map<string, typeof active> }).active;
    activeMap.set(thread.id, active);
    const handleWebRequest = (
      supervisor as unknown as {
        handleWebRequest: (
          current: typeof active,
          request: Record<string, unknown>
        ) => Promise<void>;
      }
    ).handleWebRequest.bind(supervisor);
    const requestId = randomUUID();
    await handleWebRequest(active, {
      kind: 'web-request',
      protocolVersion: 1,
      requestId,
      threadId: thread.id,
      turnId: turn.id,
      toolCallId: 'web-tool-1',
      action: {
        type: 'search',
        queries: ['current information'],
        resultCount: 5,
        includeContent: false,
      },
    });
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ requestId, taskId: thread.id }));
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'web-response', requestId, ok: true })
    );

    await handleWebRequest(active, {
      kind: 'web-request',
      protocolVersion: 1,
      requestId,
      threadId: thread.id,
      turnId: turn.id,
      toolCallId: 'web-tool-duplicate',
      action: {
        type: 'search',
        queries: ['duplicate'],
        resultCount: 5,
        includeContent: false,
      },
    });
    expect(execute).toHaveBeenCalledOnce();
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'web-response', requestId, ok: false })
    );

    const staleId = randomUUID();
    await handleWebRequest(active, {
      kind: 'web-request',
      protocolVersion: 1,
      requestId: staleId,
      threadId: thread.id,
      turnId: randomUUID(),
      toolCallId: 'web-tool-2',
      action: {
        type: 'search',
        queries: ['stale'],
        resultCount: 5,
        includeContent: false,
      },
    });
    expect(execute).toHaveBeenCalledOnce();
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'web-response', requestId: staleId, ok: false })
    );
    database.close();
  });

  it('rejects a stale approval before mutating its persisted decision', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'adrouter-supervisor-'));
    directories.push(directory);
    const database = new AppDatabase(join(directory, 'agent.sqlite'));
    const project = database.createProject({
      path: '/tmp/project',
      displayName: 'project',
      instructions: '',
      permissionMode: 'workspace-write',
      git: { branch: 'main', changeCount: 0, isDirty: false, remote: null },
    });
    const thread = database.createThread({
      projectId: project.id,
      title: 'Task',
      model: 'auto',
      thinkingLevel: 'medium',
    });
    const turn = database.createTurn(thread.id, 'Task');
    const approvalId = randomUUID();
    database.createApproval({
      id: approvalId,
      threadId: thread.id,
      turnId: turn.id,
      kind: 'command',
      argv: ['custom-runner'],
      path: null,
      cwd: '/tmp/project',
      risk: 'medium',
      reason: 'Unknown command.',
      decision: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    });
    const supervisor = new RuntimeSupervisor(database, '/tmp/runtime.js', vi.fn());

    expect(() => supervisor.assertApprovalActive(approvalId)).toThrow(
      'This thread has no active agent runtime.'
    );
    expect(database.getApproval(approvalId)?.decision).toBeNull();
    database.close();
  });

  it('publishes events with the intended subscription identifier', () => {
    const send = vi.fn();
    const webContents = {
      once: vi.fn(),
      isDestroyed: () => false,
      send,
    } as unknown as WebContents;
    const subscriptions = new EventSubscriptions();
    const subscriptionId = subscriptions.subscribe(
      webContents,
      '11111111-1111-4111-8111-111111111111'
    );
    const event = {
      id: '22222222-2222-4222-8222-222222222222',
      threadId: '11111111-1111-4111-8111-111111111111',
      turnId: null,
      sequence: 1,
      type: 'diagnostic' as const,
      timestamp: '2026-07-11T12:00:00.000Z',
      payload: { message: 'ready' },
    };

    subscriptions.publish(event);

    expect(send).toHaveBeenCalledWith('adrouter:event', { subscriptionId, event });
  });
});

it('binds IPC presence to the active task, rejects repeats, and blocks ordinary input', () => {
  const supervisor = new RuntimeSupervisor({} as AppDatabase, '/fixture/runtime.js', () => {});
  const postMessage = vi.fn();
  const taskId = randomUUID();
  const promptId = randomUUID();
  Object.defineProperty(supervisor, 'active', {
    value: new Map([
      [
        'thread',
        {
          turnId: taskId,
          child: { postMessage },
          presence: { taskId, promptId, issuedAt: performance.now() - 500 },
        },
      ],
    ]),
  });
  expect(() => supervisor.steer('thread', 'must not execute')).toThrow(/presence prompt/);
  expect(() => supervisor.queueFollowUp('thread', 'must not queue')).toThrow(/presence prompt/);
  expect(() => supervisor.clearQueue('thread')).toThrow(/presence prompt/);
  expect(() => supervisor.acknowledgePresence('thread', randomUUID(), promptId)).toThrow(/stale/);
  expect(() => supervisor.acknowledgePresence('thread', taskId, randomUUID())).toThrow(/stale/);
  supervisor.acknowledgePresence('thread', taskId, promptId);
  expect(postMessage).toHaveBeenCalledExactlyOnceWith({
    kind: 'request',
    request: { type: 'presence-ack', taskId, promptId },
  });
  expect(() => supervisor.acknowledgePresence('thread', taskId, promptId)).toThrow(/stale/);
});
