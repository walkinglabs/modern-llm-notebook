export const GITHUB_OWNER = 'walkinglabs'
export const GITHUB_REPO = 'modern-llm-notebook'
export const GITHUB_BRANCH = 'main'

export const GITHUB_REPO_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`
export const GITHUB_REPO_GIT_URL = `${GITHUB_REPO_URL}.git`

function getNotebookRoot(meta) {
  return meta?.lang === 'en' ? 'notebooks-en' : 'notebooks'
}

export function getNotebookGitHubUrl(meta, notebookId) {
  return `${GITHUB_REPO_URL}/blob/${GITHUB_BRANCH}/${getNotebookRoot(meta)}/${meta?.partDir}/${notebookId}.ipynb`
}

export function getNotebookColabUrl(meta, notebookId) {
  return `https://colab.research.google.com/github/${GITHUB_OWNER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${getNotebookRoot(meta)}/${meta?.partDir}/${notebookId}.ipynb`
}

function getNotebookPath(meta, notebookId) {
  return `${getNotebookRoot(meta)}/${meta?.partDir}/${notebookId}.ipynb`
}

export function getNotebookModelScopeUrl(meta, notebookId) {
  return `https://modelscope.cn/notebook/share/github/${GITHUB_OWNER}/${GITHUB_REPO}` +
    `/blob/${GITHUB_BRANCH}/${getNotebookPath(meta, notebookId)}`
}

export function getNotebookLaunchLinks(meta, notebookId) {
  const isEnglish = meta?.lang === 'en'
  return [
    {
      id: 'modelscope',
      label: isEnglish ? 'Open in ModelScope' : '在 ModelScope 打开',
      href: getNotebookModelScopeUrl(meta, notebookId),
    },
    {
      id: 'colab',
      label: isEnglish ? 'Open in Colab' : '在 Colab 打开',
      href: getNotebookColabUrl(meta, notebookId),
    },
  ]
}
