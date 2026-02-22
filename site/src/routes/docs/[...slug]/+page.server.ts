import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { marked, type Tokens, type Renderer } from 'marked';

const repoRoot = process.cwd();
const docsRoot = path.join(repoRoot, 'docs');
const docRoot = path.join(repoRoot, 'doc');
const examplesRoot = path.join(repoRoot, 'examples');
const skillsDoc = path.join(docRoot, 'skill.md');
const githubBlobRoot = 'https://github.com/miniduckco/stash/blob/main';

marked.setOptions({ gfm: true, breaks: false });

const toPosix = (value: string) => value.split(path.sep).join('/');

const mapLink = (href: string, baseDir: string) => {
	if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
		return href;
	}

	const resolvedPath = path.resolve(baseDir, href);

	if (resolvedPath.startsWith(docsRoot)) {
		let rel = toPosix(path.relative(docsRoot, resolvedPath));
		if (rel.endsWith('README.md')) {
			rel = rel.replace(/README\.md$/, '');
		}
		if (rel.endsWith('.md')) {
			rel = rel.replace(/\.md$/, '');
		}
		return `/docs/${rel}`.replace(/\/$/, '');
	}

	if (resolvedPath.startsWith(docRoot)) {
		let rel = toPosix(path.relative(docRoot, resolvedPath));
		if (rel.endsWith('README.md')) {
			rel = rel.replace(/README\.md$/, '');
		}
		if (rel.endsWith('.md')) {
			rel = rel.replace(/\.md$/, '');
		}
		return `/docs/${rel}`.replace(/\/$/, '');
	}

	if (resolvedPath.startsWith(examplesRoot)) {
		const rel = toPosix(path.relative(repoRoot, resolvedPath));
		return `${githubBlobRoot}/${rel}`;
	}

	if (resolvedPath === path.join(repoRoot, '.env.example')) {
		return `${githubBlobRoot}/.env.example`;
	}

	return href;
};

const resolveDocPath = (slug: string[]) => {
	if (slug.length === 1 && (slug[0] === 'skill' || slug[0] === 'skills')) {
		return skillsDoc;
	}

	const basePath = path.join(docsRoot, ...slug);
	return [
		`${basePath}.md`,
		path.join(basePath, 'README.md')
	];
};

const extractTitle = (content: string) => {
	const match = content.match(/^#\s+(.+)$/m);
	return match?.[1]?.trim() ?? 'Documentation';
};

export const load = async ({ params }: { params: { slug?: string } }) => {
	const slug = params.slug ? params.slug.split('/') : [];
	if (slug.some((part) => part.includes('..'))) {
		throw error(400, 'Invalid path');
	}
	const candidatePaths = resolveDocPath(slug);
	const paths = Array.isArray(candidatePaths) ? candidatePaths : [candidatePaths];

	for (const filePath of paths) {
		try {
			const content = await readFile(filePath, 'utf-8');
			const baseDir = path.dirname(filePath);
			const renderer = new marked.Renderer();
			renderer.link = function (this: Renderer, token: Tokens.Link) {
				const mappedHref = token.href ? mapLink(token.href, baseDir) : token.href;
				const titleAttr = token.title ? ` title="${token.title}"` : '';
				const text = this.parser.parseInline(token.tokens);
				return `<a href="${mappedHref}"${titleAttr}>${text}</a>`;
			};
			const html = await marked.parse(content, { renderer });
			return {
				title: extractTitle(content),
				html
			};
		} catch (err) {
			continue;
		}
	}

	throw error(404, 'Doc not found');
};
