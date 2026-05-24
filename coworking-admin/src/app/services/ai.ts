import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private apiUrl = 'http://localhost:5193/api/AI/ask';

  constructor(private http: HttpClient) {}

  ask(prompt: string, history: ChatMessage[]): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(this.apiUrl, { prompt, history });
  }
}
