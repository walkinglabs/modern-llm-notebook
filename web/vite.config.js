import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'
import { existsSync, readdirSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

function normalizeNotebookSource(source) {
  return Array.isArray(source) ? source.join('') : source || ''
}

function stripMarkdownInline(value) {
  return String(value)
    .replace(/^#+\s*/, '')
    .replace(/\s+#+$/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

function getNotebookTitle(filePath, fallback) {
  try {
    const nb = JSON.parse(readFileSync(filePath, 'utf-8'))
    for (const cell of nb.cells || []) {
      if (cell.cell_type !== 'markdown') continue
      const source = normalizeNotebookSource(cell.source)
      const heading = source.match(/^#\s+(.+)$/m)
      if (heading) return stripMarkdownInline(heading[1])
    }
  } catch {
    // Invalid notebooks should fail visibly in the viewer when opened.
  }
  return fallback
}

function listNotebookFiles(dir) {
  if (!existsSync(dir)) return []

  const entries = readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return listNotebookFiles(entryPath)
    return entry.isFile() && entry.name.endsWith('.ipynb') ? [entryPath] : []
  })
}

function buildNotebookCatalogFor(rootDir) {
  const catalog = {}
  const baseDir = path.join(repoRoot, rootDir)

  for (const filePath of listNotebookFiles(baseDir)) {
    const rel = path.relative(baseDir, filePath).replaceAll(path.sep, '/')
    const match = rel.match(/^([^/]+)\/([^/]+)\.ipynb$/)
    if (!match) continue
    const [, partDir, id] = match
    catalog[id] = {
      partDir,
      title: getNotebookTitle(filePath, id),
    }
  }

  return catalog
}

function buildNotebookCatalog() {
  return {
    zh: buildNotebookCatalogFor('notebooks'),
    en: buildNotebookCatalogFor('notebooks-en'),
  }
}

function notebookCatalogPlugin() {
  const virtualModuleId = 'virtual:notebook-catalog'
  const resolvedVirtualModuleId = '\0' + virtualModuleId
  const watchedDirs = [
    path.join(repoRoot, 'notebooks'),
    path.join(repoRoot, 'notebooks-en'),
  ]

  return {
    name: 'vite-plugin-notebook-catalog',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
    },
    configureServer(server) {
      // Watch the directory trees so renames / new subdirectories trigger reloads
      for (const dir of watchedDirs) {
        server.watcher.add(dir)
      }

      // chokidar 的监听器是全局的，只注册一组；并合并原子保存产生的连续事件。
      let reloadTimer = null
      const scheduleRebuild = (event) => (file) => {
        if (!file || !file.endsWith('.ipynb')) return
        clearTimeout(reloadTimer)
        reloadTimer = setTimeout(() => {
          const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
          if (!mod) return
          server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload' })
          server.config.logger.info(`[notebook-catalog] ${event}: ${path.basename(file)}`, {
            timestamp: true,
          })
        }, 100)
      }
      server.watcher.on('change', scheduleRebuild('change'))
      server.watcher.on('add', scheduleRebuild('add'))
      server.watcher.on('unlink', scheduleRebuild('unlink'))
      server.httpServer?.once('close', () => clearTimeout(reloadTimer))
    },
    buildStart() {
      // Also add individual files for build-mode watching
      for (const filePath of [
        ...listNotebookFiles(path.join(repoRoot, 'notebooks')),
        ...listNotebookFiles(path.join(repoRoot, 'notebooks-en')),
      ]) {
        this.addWatchFile(filePath)
      }
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) return
      return `export const NOTEBOOK_CATALOG = ${JSON.stringify(buildNotebookCatalog())}`
    },
  }
}

function changelogPlugin() {
  const virtualModuleId = 'virtual:changelog'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'vite-plugin-changelog',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) return
      try {
        // 从项目根目录（web 的上级）读取 git log
        const log = execSync(
          'git log -30 --pretty=format:"%h|%ai|%s"',
          { cwd: new URL('..', import.meta.url), encoding: 'utf-8' }
        )
        const commits = log.trim().split('\n').filter(Boolean).map(line => {
          const [hash, date, ...rest] = line.split('|')
          return { hash, date: date.slice(0, 10), message: rest.join('|') }
        })
        return `export const COMMITS = ${JSON.stringify(commits)}`
      } catch {
        return `export const COMMITS = []`
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), notebookCatalogPlugin(), changelogPlugin()],
  define: {
    __CHANGELOG_COMMITS__: (() => {
      try {
        const log = execSync(
          'git log -30 --pretty=format:"%h|%ai|%s"',
          { cwd: new URL('..', import.meta.url), encoding: 'utf-8' }
        )
        return JSON.stringify(
          log.trim().split('\n').filter(Boolean).map(line => {
            const [hash, date, ...rest] = line.split('|')
            return { hash, date: date.slice(0, 10), message: rest.join('|') }
          })
        )
      } catch {
        return '[]'
      }
    })(),
  },
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5273,
    strictPort: false,
    fs: {
      allow: [repoRoot],
    },
  },
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
})
