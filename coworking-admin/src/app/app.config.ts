import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter ,withInMemoryScrolling} from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { provideLottieOptions } from 'ngx-lottie';
import player from 'lottie-web';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(
      routes,
    // 核心：啟用錨點滾動與跳頁流暢回復
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled'})
        ),
        provideLottieOptions({
      player: () => player,
    }),
        
  ]
};
