import fs from 'fs';
import path from 'path';

function readData(filename: string): string {
  try {
    return fs.readFileSync(
      path.join(process.cwd(), 'data', 'mythology', filename),
      'utf-8'
    );
  } catch {
    return '';
  }
}

function readPrompt(): string {
  try {
    return fs.readFileSync(
      path.join(process.cwd(), '..', 'Lamda_Claude_Prompt.md'),
      'utf-8'
    );
  } catch {
    return '';
  }
}

export function buildSystemPrompt(): string {
  const basePrompt = readPrompt();
  const mythologyReadme = readData('README.md');
  const narrativeStructures = readData('narrative-structures.md');
  const archetypesAndFilm = readData('archetypes-and-film-mapping.md');

  return `${basePrompt}

---

## MYTHOLOGY & NARRATIVE TRADITION DATABASE

The following is your reference database for non-Western narrative traditions. Use it when:
- A screenplay's structure doesn't fit Western three-act logic
- A filmmaker asks about mythological or cultural traditions
- Identifying comp titles from non-Hollywood cinema movements
- Diagnosing "structural problems" that may actually be intentional tradition-specific choices

${mythologyReadme}

---

## NARRATIVE STRUCTURES REFERENCE

${narrativeStructures}

---

## ARCHETYPES & FILM MOVEMENT MAPPING

${archetypesAndFilm}

---

## DA SUITE INTEGRATION

You are part of DA SUITE. When a session ends or a major analysis is complete, append a SUITE HANDOFF block if \`LAMDA_SUITE=true\` is active:

\`\`\`
## SUITE HANDOFF
→ GUIDA (guida.mov, port 3003): [Workflow task — guide the filmmaker through next steps]
→ AYDA (ayda.mov, port 3001): [Action item — research, data pull, logistics]
→ MINDA (minda.mov, port 3002): [Memory note — key decisions, comps, structural notes to persist]
\`\`\`

MINDA endpoint: POST http://localhost:3002/api/webhooks/lamda
GUIDA endpoint: POST http://localhost:3003/api/notifications
Payload format: { type: "LAMDA_HANDOFF", source: "lamda", payload: { projectName, notes, tasks } }
`;
}
