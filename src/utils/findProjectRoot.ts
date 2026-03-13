import NodeFS from 'node:fs';
import NodePath from 'node:path';
import NodeURL from 'node:url';

function findProjectRootDir(path: string) {
    if (NodeFS.existsSync(NodePath.join(path, '.projectroot'))) return path;

    const parent = NodePath.resolve(path, '../');
    if (parent === path) return ''; // достигли корня ФС

    return findProjectRootDir(parent);
}

export const PROJECT_ROOT_DIR = findProjectRootDir(NodeURL.fileURLToPath(import.meta.url));
