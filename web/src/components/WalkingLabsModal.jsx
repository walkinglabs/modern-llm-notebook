import { useEffect, useState } from 'react'
import {
  ExternalLink,
  Github,
  MessageCircle,
  Sparkles,
  X,
} from 'lucide-react'

const WECHAT_GROUP_QR_URL = 'https://github.com/walkinglabs/.github/raw/main/profile/wechat.png'
const DISCORD_INVITE_URL = 'https://discord.gg/XU7DQmpqk'

const COPY = {
  zh: {
    title: 'WalkingLabs',
    eyebrow: '一个专注于 Agent 的开源实验室',
    body: 'WalkingLabs 是一个专注于 Agent 相关基础建设与教程的开源实验室。' +
      '我们探索 Agent 框架、工具链和最佳实践，并把过程中积累的经验整理成开源教程和项目。',
    note: '如果你对 Agent 技术感兴趣，欢迎加入我们一起讨论。',
    github: '看看 GitHub',
    discord: '加入 Discord',
    qrTitle: '加入社区',
    qrDesc: '扫码加入 WalkingLabs 微信群，一起探讨 Agent 技术。',
    loading: '加载二维码',
    missing: '二维码加载失败',
    close: '关闭',
  },
  en: {
    title: 'WalkingLabs',
    eyebrow: 'An Open-Source Lab Focused on Agents',
    body: 'WalkingLabs is an open-source lab dedicated to Agent infrastructure and tutorials. ' +
      'We explore agent frameworks, toolchains, and best practices, sharing what we learn as open-source projects.',
    note: 'If you are interested in Agent technology, welcome to join the discussion.',
    github: 'View GitHub',
    discord: 'Join Discord',
    qrTitle: 'Join the Community',
    qrDesc: 'Scan to join the WalkingLabs WeChat group.',
    loading: 'Loading QR',
    missing: 'QR failed to load',
    close: 'Close',
  },
}

export default function WalkingLabsModal({ isOpen, onClose, lang }) {
  const t = COPY[lang === 'en' ? 'en' : 'zh']
  const [qrLoaded, setQrLoaded] = useState({ group: false })
  const [qrFailed, setQrFailed] = useState({ group: false })

  useEffect(() => {
    if (!isOpen) return
    setQrLoaded({ group: false })
    setQrFailed({ group: false })
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={t.title}>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card walkinglabs-modal">
        <button className="modal-close walkinglabs-close" onClick={onClose} aria-label={t.close}>
          <X className="w-4 h-4" />
        </button>

        <div className="walkinglabs-hero">
          <div className="walkinglabs-mark" aria-hidden="true">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="walkinglabs-eyebrow">{t.eyebrow}</div>
            <h2>{t.title}</h2>
          </div>
        </div>

        <div className="modal-body walkinglabs-body">
          <div className="walkinglabs-intro">
            <p className="walkinglabs-lede">{t.body}</p>
            <p>{t.note}</p>
            <a
              href="https://github.com/walkinglabs"
              target="_blank"
              rel="noreferrer"
              className="walkinglabs-link"
            >
              <Github className="w-4 h-4" />
              <span>{t.github}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noreferrer"
              className="walkinglabs-link walkinglabs-discord-link"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.discord}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="walkinglabs-qr-panel">
            <div className="walkinglabs-qr-heading">
              <MessageCircle className="w-4 h-4" />
              <div>
                <h3>{t.qrTitle}</h3>
                <p>{t.qrDesc}</p>
              </div>
            </div>

            <div className="walkinglabs-qr-grid">
              <div className="walkinglabs-qr-card">
                <div className="walkinglabs-qr-box">
                  {!qrLoaded.group && !qrFailed.group && (
                    <div className="walkinglabs-qr-state">
                      <div className="walkinglabs-qr-spinner" />
                      <span>{t.loading}</span>
                    </div>
                  )}
                  {qrFailed.group && (
                    <div className="walkinglabs-qr-state">
                      <strong>{t.missing}</strong>
                    </div>
                  )}
                  <img
                    src={WECHAT_GROUP_QR_URL}
                    alt="WalkingLabs WeChat group QR code"
                    onLoad={() => {
                      setQrLoaded((loaded) => ({ ...loaded, group: true }))
                    }}
                    onError={() => {
                      setQrFailed((failed) => ({ ...failed, group: true }))
                    }}
                    className={qrLoaded.group && !qrFailed.group ? 'is-loaded' : ''}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
