import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * LanguageInterceptor
 * 
 * This interceptor reads the 'x-lang' header (or 'Accept-Language') from incoming
 * requests and attaches the language code to the request object for use by services.
 * 
 * Usage in services:
 *   const lang = request.lang || 'en';
 *   return this.getLocalizedContent(lang);
 */
@Injectable()
export class LanguageInterceptor implements NestInterceptor {
    private readonly SUPPORTED_LANGUAGES = ['en', 'fr', 'es', 'ja', 'zh', 'ar'];
    private readonly DEFAULT_LANGUAGE = 'en';

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        // Priority: x-lang header > Accept-Language header > default
        const xLang = request.headers['x-lang'];
        const acceptLanguage = request.headers['accept-language'];

        let detectedLang = this.DEFAULT_LANGUAGE;

        if (xLang && this.SUPPORTED_LANGUAGES.includes(xLang)) {
            detectedLang = xLang;
        } else if (acceptLanguage) {
            // Parse Accept-Language (e.g., 'fr-FR,fr;q=0.9,en;q=0.8')
            const primaryLang = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase();
            if (primaryLang && this.SUPPORTED_LANGUAGES.includes(primaryLang)) {
                detectedLang = primaryLang;
            }
        }

        // Attach to request object for downstream use
        request.lang = detectedLang;

        return next.handle();
    }
}
