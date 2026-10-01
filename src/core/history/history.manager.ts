import { HistoryRecord, IHistoryRepository } from './history.types';

class LocalStorageHistoryAdapter implements IHistoryRepository {
  private storageKey = 'bp_history_records';

  private getRecords(): HistoryRecord[] {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : [];
  }

  private setRecords(records: HistoryRecord[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(records));
  }

  public async save(record: HistoryRecord): Promise<void> {
    const records = this.getRecords();
    const updated = [record, ...records.filter((r) => r.id !== record.id)].slice(0, 100);
    this.setRecords(updated);
  }

  public async list(filter?: { toolId?: string; limit?: number }): Promise<HistoryRecord[]> {
    let records = this.getRecords();
    if (filter?.toolId) {
      records = records.filter((r) => r.toolId === filter.toolId);
    }
    if (filter?.limit) {
      records = records.slice(0, filter.limit);
    }
    return records;
  }

  public async remove(id: string): Promise<void> {
    const records = this.getRecords().filter((r) => r.id !== id);
    this.setRecords(records);
  }

  public async clear(toolId?: string): Promise<void> {
    if (toolId) {
      const records = this.getRecords().filter((r) => r.toolId !== toolId);
      this.setRecords(records);
    } else {
      localStorage.removeItem(this.storageKey);
    }
  }
}

class HistoryManager {
  private adapter: IHistoryRepository;

  constructor() {
    // Inicialmente utiliza o LocalStorageAdapter; no futuro troca por SupabaseHistoryAdapter
    this.adapter = new LocalStorageHistoryAdapter();
  }

  public async record(
    toolId: string,
    category: string,
    title: string,
    inputSummary: string,
    outputSummary: string,
    payload: unknown = {}
  ): Promise<void> {
    const record: HistoryRecord = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      toolId,
      category,
      timestamp: Date.now(),
      title,
      inputSummary,
      outputSummary,
      payload,
      synced: false,
    };
    await this.adapter.save(record);
  }

  public async getHistory(toolId?: string, limit: number = 20): Promise<HistoryRecord[]> {
    return this.adapter.list({ toolId, limit });
  }

  public async deleteEntry(id: string): Promise<void> {
    return this.adapter.remove(id);
  }

  public async clearAll(toolId?: string): Promise<void> {
    return this.adapter.clear(toolId);
  }
}

export const historyManager = new HistoryManager();
