import { en } from './en';
import { fr } from './fr';
import { es } from './es';
import { ja } from './ja';
import { zh } from './zh';
import { ar } from './ar';

import { parentAssessmentTranslations } from './parentAssessmentTranslations';

export const translations = {
  en: { ...en, ...parentAssessmentTranslations.en },
  fr: { ...fr, ...parentAssessmentTranslations.fr },
  es: { ...es, ...parentAssessmentTranslations.es },
  ja: { ...ja, ...parentAssessmentTranslations.ja },
  zh: { ...zh, ...parentAssessmentTranslations.zh },
  ar: { ...ar, ...parentAssessmentTranslations.ar },
};
