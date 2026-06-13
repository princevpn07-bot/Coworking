import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  action?: AIAction;
}

export interface AIActionParams {
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
  city?: string;
  keyword?: string;
}

export interface AIAction {
  type: string;
  params: AIActionParams;
}

export interface AskResponse {
  reply: string;
  action?: AIAction;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private apiUrl = 'http://localhost:5193/api/AI/ask';

  constructor(private http: HttpClient) {}

  ask(prompt: string, history: ChatMessage[]): Observable<AskResponse> {
    return this.http.post<AskResponse>(this.apiUrl, { prompt, history });
  }
}
