import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, 'src')
const TS_EXTS = ['.ts', '.tsx', '.mts', '.cts']

async function walk(dir) {
	const out = []
	for (const e of await fs.readdir(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name)
		if (e.isDirectory()) out.push(...(await walk(p)))
		else if (/\.(ts|tsx|mts|cts)$/.test(e.name)) out.push(p)
	}
	return out
}

async function resolveTarget(fromFile, spec) {
	if (!spec.startsWith('./') && !spec.startsWith('../')) return null
	if (/\.(?:[mc]?js|json)$/.test(spec)) return null

	const base = path.resolve(path.dirname(fromFile), spec)

	for (const ext of TS_EXTS) {
		try {
			await fs.access(base + ext)
			return spec + '.js'
		} catch {}
	}

	const idx = path.join(base, 'index')
	for (const ext of TS_EXTS) {
		try {
			await fs.access(idx + ext)
			return spec.replace(/\/?$/, '/index.js')
		} catch {}
	}
	return null
}

async function processFile(file) {
	let src = await fs.readFile(file, 'utf8')
	let changed = false

	// 1) import ... from '...'
	const fromRe = /(import|export)\s[^'";]*?from\s*(['"])(\.\.?\/[^'"?#]+)\2/g
	src = await replaceAsync(src, fromRe, async (m, _kw, q, spec) => {
		const fixed = await resolveTarget(file, spec)
		if (!fixed) return m
		changed = true
		return m.replace(q + spec + q, q + fixed + q)
	})

	// 2) side-effect imports: import '...'
	const sideRe = /(\bimport\s*)(['"])(\.\.?\/[^'"?#]+)\2/g
	src = await replaceAsync(src, sideRe, async (m, prefix, q, spec) => {
		const fixed = await resolveTarget(file, spec)
		if (!fixed) return m
		changed = true
		return prefix + q + fixed + q
	})

	// 3) dynamic imports: import('...')
	const dynRe = /(\bimport\s*\(\s*)(['"])(\.\.?\/[^'"?#]+)\2(\s*\))/g
	src = await replaceAsync(src, dynRe, async (m, pre, q, spec, post) => {
		const fixed = await resolveTarget(file, spec)
		if (!fixed) return m
		changed = true
		return pre + q + fixed + q + post
	})

	if (changed) await fs.writeFile(file, src, 'utf8')
	return changed
}

async function replaceAsync(str, regex, asyncFn) {
	const parts = []
	let lastIndex = 0
	let match = regex.exec(str)
	while (match) {
		const chunk = str.slice(lastIndex, match.index)
		parts.push(chunk)
		parts.push(await asyncFn(...match))
		lastIndex = regex.lastIndex
		match = regex.exec(str)
	}
	parts.push(str.slice(lastIndex))
	return parts.join('')
}

;(async () => {
	const files = await walk(SRC_DIR)
	let count = 0
	for (const f of files) {
		if (await processFile(f)) count++
	}
	console.log(`Updated ${count} files`)
})().catch((e) => {
	console.error(e)
	process.exit(1)
})
