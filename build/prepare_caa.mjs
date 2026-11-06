import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { importRuntimeModule } = await import(pathToFileURL('C:/Users/cuscsoft/.codex/plugins/cache/openai-primary-runtime/presentations/26.1026.10807/skills/Presentations/container_tools/runtime_helpers.mjs').href);

const workspaceDir = process.cwd();
const sourcePath = path.join(workspaceDir, 'doc', 'Dự đoán nguy cơ đột quỵ — So sánh Decision Tree, kNN, SVM (1).pptx');
const candidatePath = path.join(workspaceDir, 'build', 'candidate-caa.pptx');

const { FileBlob, PresentationFile } = await importRuntimeModule('@oai/artifact-tool');
const presentation = await PresentationFile.importPptx(await FileBlob.load(sourcePath));
const exported = await PresentationFile.exportPptx(presentation);
await fs.mkdir(path.dirname(candidatePath), { recursive: true });
await exported.save(candidatePath);
console.log(JSON.stringify({ candidatePath, slideCount: presentation.slides.items.length }));
