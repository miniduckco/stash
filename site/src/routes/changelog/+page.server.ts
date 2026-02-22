import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';

const repoRoot = process.cwd();
const changelogPath = path.join(repoRoot, 'CHANGELOG.md');

marked.setOptions({ gfm: true, breaks: false });

export const load = async () => {
	try {
		const content = await readFile(changelogPath, 'utf-8');
		const html = await marked.parse(content);
		return {
			title: 'Changelog',
			html
		};
	} catch (err) {
		throw error(404, 'Changelog not found');
	}
};
