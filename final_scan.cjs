const fs = require('fs');
const path = require('path');

const directoriesToScan = ['components', 'App.tsx'];
const ignoredFiles = ['AiAssistant.tsx']; // Ignore chat logic strings if needed, though we only ignore chat content. Actually, let's scan it and see what it finds.

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    const stat = fs.statSync(dir);
    if (stat.isFile()) {
        if (dir.endsWith('.tsx') || dir.endsWith('.ts')) {
            callback(dir);
        }
    } else if (stat.isDirectory()) {
        fs.readdirSync(dir).forEach(f => {
            walkDir(path.join(dir, f), callback);
        });
    }
}

const foundStrings = [];

function checkFile(filePath) {
    const isChat = filePath.includes('Chat') || filePath.includes('AiAssistant');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        // Skip imports, SVG, console.log, classNames, urls
        if (line.includes('import ') || line.includes('from ') || line.includes('console.log') || line.includes('className=') || line.includes('d="M') || line.includes('<path') || line.includes('http')) {
            return;
        }

        // Check for common patterns
        const patterns = [
            /placeholder="([^"{]+)"/g, // placeholder="Text"
            /alert\("([^"]+)"\)/g,      // alert("Text")
            /alert\('([^']+)'\)/g,
            /window\.confirm\("([^"]+)"\)/g,
            /window\.confirm\('([^']+)'\)/g,
            />\s*([a-zA-Z][^<>{}:;\\]*[a-zA-Z\.?!])\s*</g // >Text< 
        ];

        patterns.forEach(regex => {
            let match;
            while ((match = regex.exec(line)) !== null) {
                const text = match[1].trim();
                // If it's a number, single character, or already translated {t('...')}
                if (text.length > 2 && !line.includes('t(') && !line.includes('{t(') && !text.match(/^[0-9\W]+$/)) {
                    // Exclude common programming keywords or known specific non-translated stuff
                    if (text === 'Loading...' || text === 'true' || text === 'false') continue;

                    // Allow chat component texts? (Based on rule)
                    // "the chat content stays teh same tat is teh only exception"
                    // So we ignore user sent texts, but what about hardcoded stuff in AiAssistant?

                    foundStrings.push({
                        file: filePath,
                        line: index + 1,
                        text: text,
                        context: line.trim()
                    });
                }
            }
        });
    });
}

directoriesToScan.forEach(dir => walkDir(dir, checkFile));

if (foundStrings.length > 0) {
    console.log(`Found ${foundStrings.length} potential hardcoded strings:`);
    foundStrings.forEach(s => console.log(`${s.file}:${s.line} - "${s.text}" => ${s.context}`));
} else {
    console.log('No hardcoded strings found! All looks clean.');
}
