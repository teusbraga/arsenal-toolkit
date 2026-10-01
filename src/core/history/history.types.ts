export interface HistoryRecord<T = unknown> {
  id: string;
  toolId: string;
  category: string;
  timestamp: number;
  title: string;
  inputSummary: string;
  outputSummary: string;
  payload: T;
  synced?: boolean;
}

export interface IHistoryRepository {
  save(record: HistoryRecord): Promise<void>;
  list(filter?: { toolId?: string; limit?: number }): Promise<HistoryRecord[]>;
  remove(id: string): Promise<void>;
  clear(toolId?: string): Promise<void>;
}
