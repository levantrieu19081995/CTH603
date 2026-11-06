import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { importRuntimeModule } = await import(pathToFileURL('C:/Users/cuscsoft/.codex/plugins/cache/openai-primary-runtime/presentations/26.1026.10807/skills/Presentations/container_tools/runtime_helpers.mjs').href);

const workspaceDir = process.cwd();
const skillDir = 'C:/Users/cuscsoft/.codex/plugins/cache/openai-primary-runtime/presentations/26.1026.10807/skills/Presentations';
const candidatePath = path.join(workspaceDir, 'build', 'candidate-caa.pptx');
const finalPath = path.join(workspaceDir, 'doc', 'caa_updated.pptx');
const stagingDir = path.join(workspaceDir, 'build', 'finalizer');

const { finalizePresentation } = await import(pathToFileURL(path.join(skillDir, 'container_tools', 'artifact_tool_utils.mjs')).href);
const result = await finalizePresentation({
  workspaceDir,
  candidatePath,
  finalPath,
  pythonExecutable: 'C:/Users/cuscsoft/AppData/Local/Programs/Python/Python313/python.exe',
  integrityValidatorPath: path.join(skillDir, 'container_tools', 'inspect_presentation_package_integrity.py'),
  layoutValidatorPath: path.join(skillDir, 'container_tools', 'inspect_presentation_layout_geometry.py'),
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-bullet-geometry', '--validate-heading-fit'],
  explicitTotalSlideCount: 12,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, 'caa_updated.validation.json'),
});
console.log(JSON.stringify(result, null, 2));
