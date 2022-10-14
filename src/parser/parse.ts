import { Position, Range, Uri } from 'vscode';
import { PragmaParseResult } from '../model/PragmaParseResult';
import * as fs from 'fs';

export function parse(uri: Uri): PragmaParseResult[] {
    const contents = fs.readFileSync(uri.fsPath).toString();
    const lines = contents.split('\n');

    const results: PragmaParseResult[] = [];

    for (let line = 0; line < lines.length; line++) {
        let lineStr = lines[line];
        const lineStrTrimmed = lineStr.trim();
        if (!lineStrTrimmed.startsWith('#')) {
            continue;
        }

        let lineUppercase = lineStr.toUpperCase();
        let character = lineUppercase[0] === '#' ? 0 : lineUppercase.indexOf('#');
        const ifPos = lineUppercase.indexOf('#REGION ');
        let pos = ifPos + 7;
        if (ifPos !== character) {
            const elifPos = lineUppercase.indexOf('#ENDREGION ');
            if (elifPos !== character) {
                continue;
            }
            pos = elifPos + 10;
        }

        // Regex explenation:
        // /        - Delimiter for js. Defines the begin of the expression
        // \[       - \[ matches the character [ 
        // [^\]]*   - [^\]] Matches all characters that are not \]. 
        // \]       - \] matches the character ]
        // /        - Delimiter for js. Defines the begin of the expression
        // g        - modifier: global. All matches (don't return after first match)

        const regex = /\[[^\]]*\]/g;
        const parts = lineUppercase.match(regex);
        if (!parts) {
            continue;
        }

        for (let part of parts) {
            const result = results.find((result) => result.id === part);
            if (result) {
                result.positions.push(new Position(line, character));
            } else {
                results.push({
                    uri,
                    id: part,
                    positions: [new Position(line, character)],
                });
            }
        }
    }

    return results;
}
