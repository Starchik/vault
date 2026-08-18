import { useState } from 'react'
import { X, ExternalLink } from 'lucide-react'

export default function OnrampFrame({ url, title, onClose }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="onramp-frame-backdrop">
      <div className="onramp-frame-topbar">
        <span>{title}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={url} target="_blank" rel="noreferrer" className="icon-btn" title="Открыть в новой вкладке">
            <ExternalLink size={16} />
          </a>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>
      </div>
      {!loaded && (
        <div className="onramp-frame-loading">
          <div className="spinner" />
        </div>
      )}
      <iframe
        src={url}
        title={title}
        className="onramp-frame-iframe"
        onLoad={() => setLoaded(true)}
        allow="payment; camera"
      />
    </div>
  )
}
