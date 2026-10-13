import { useEffect } from 'react'
import Icon from './Icon.jsx'
import { UPDATES } from '../updates.js'

export default function UpdatesSheet({ onClose }) {
  useEffect(() => {
    // lock background scroll while the sheet is open
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="update-overlay" onClick={onClose} />
      <div className="update-sheet" role="dialog" aria-label="What's new">
        <div className="sheet-grip" />
        <header className="sheet-head">
          <div>
            <h3>What&apos;s new</h3>
            <p className="muted">App ke latest updates</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close updates">
            <Icon name="close" size={18} />
          </button>
        </header>

        <ul className="update-list">
          {UPDATES.map((update) => (
            <li key={update.id} className="update-row">
              <span className="update-icon">
                <Icon name={update.icon} size={15} />
              </span>
              <div className="update-body">
                <div className="update-top">
                  <strong>{update.title}</strong>
                  <time>{update.date}</time>
                </div>
                <ul className="update-items">
                  {update.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
