const fs = require('fs');
let content = fs.readFileSync('locales/parentAssessmentTranslations.ts', 'utf8');
content = content.replace(/,\\n/g, ',\n');
content = content.replace(/"\\n\s*\}/g, '"\n    }');
fs.writeFileSync('locales/parentAssessmentTranslations.ts', content);
console.log('Fixed literal newlines.');
