import React, { Component, useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { closeups, ExteriorScene, viewpoints } from './reference-scene.jsx'
import { roomItems } from './room-items.js'
import { entryRoom, houseSections, rooms } from './house-layout.js'
import './style.css'

function Icon({ name, size = 20 }) {
  const paths = {
    mark: <><path d="M3 18V9l9-5 9 5v9M3 13l9-5 9 5M12 8v12" /><path d="M7 19v-4m10 4v-4" /></>,
    right: <path d="M4 12h15m-6-6 6 6-6 6" />,
    left: <path d="M20 12H5m6-6-6 6 6 6" />,
    move: <path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3m12-6 3 3-3 3" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    reset: <><path d="M4 11a8 8 0 1 1 1.6 6M4 5v6h6" /><circle cx="12" cy="12" r="1" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

class SceneBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onUnavailable()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function ReviewCard({ item, onClose, onFocus }) {
  const [part, setPart] = useState(null)
  const selectedPart = item.parts?.[part]
  return <aside className="review-card" aria-labelledby="review-title">
    <div className="review-top">
      <span className="detail-label">Review minh họa</span>
      <button className="review-close" type="button" aria-label="Đóng review" onClick={onClose}><Icon name="close" size={19} /></button>
    </div>
    <div aria-live="polite">
      <h2 id="review-title">{item.label}</h2>
      <div className="review-material">{item.material}</div>
      <p>{selectedPart?.review ?? item.review}</p>
    </div>
    {item.parts && <div className="review-parts" role="group" aria-label="Món trong nhóm">
      {item.parts.map((piece, index) => <button key={piece.label} type="button" aria-pressed={part === index}
        onClick={() => setPart(part === index ? null : index)}>{piece.label}</button>)}
    </div>}
    <button className="review-focus" type="button" onClick={() => onFocus(item.id, selectedPart)}>Xem cận <Icon name="plus" size={15} /></button>
  </aside>
}

function App() {
  const [angle, setAngle] = useState(() => {
    const requestedRoom = new URLSearchParams(window.location.search).get('room')
    return rooms.some(room => room.id === requestedRoom) ? requestedRoom : 'front'
  })
  const [status, setStatus] = useState('loading')
  const [moving, setMoving] = useState(false)
  const [showMarkers, setShowMarkers] = useState(true)
  const [showRoomPanel, setShowRoomPanel] = useState(false)
  const [selection, setSelection] = useState(null)
  const controls = useRef(null)
  const markers = useRef({})
  const catalog = useRef(null)
  const room = rooms.find(candidate => candidate.id === angle)
  const inRoom = Boolean(room)
  const index = viewpoints.findIndex(view => view.id === angle)
  const detail = closeups.find(view => view.id === angle)
  const view = detail ?? viewpoints[index]
  const next = detail ? detail.reference : viewpoints[(index + 1) % viewpoints.length].id
  const number = detail ? null : String(index + 1).padStart(2, '0')
  const ready = status === 'ready'
  const interactive = ready && !moving
  const unavailable = status === 'unavailable'
  const itemsHere = inRoom ? roomItems.filter(entry => entry.room === room.id) : []
  const item = itemsHere.find(entry => entry.id === selection)

  function select(id) {
    if (!interactive) return
    if (angle === id) controls.current?.reset()
    else {
      if (inRoom || rooms.some(candidate => candidate.id === id)) {
        setMoving(true)
        setSelection(null)
        setShowRoomPanel(false)
        if (catalog.current) catalog.current.open = false
      }
      setAngle(id)
    }
  }

  const inspect = useCallback(id => {
    if (!interactive || !roomItems.some(entry => entry.id === id && entry.room === angle)) return
    if (catalog.current) catalog.current.open = false
    setSelection(id)
  }, [angle, interactive])

  useEffect(() => {
    if (!item) return
    const close = event => { if (event.key === 'Escape') setSelection(null) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [item])

  function handleKey(event) {
    const actions = {
      ArrowLeft: () => controls.current?.look(-0.16, 0),
      ArrowRight: () => controls.current?.look(0.16, 0),
      ArrowUp: () => controls.current?.look(0, -0.12),
      ArrowDown: () => controls.current?.look(0, 0.12),
      '+': () => controls.current?.zoom(0.9),
      '=': () => controls.current?.zoom(0.9),
      '-': () => controls.current?.zoom(1.1),
      '0': () => controls.current?.reset(),
    }
    if (!actions[event.key] || !interactive) return
    event.preventDefault()
    actions[event.key]()
  }

  return (
    <main className="experience" data-view={angle}>
      {new URLSearchParams(window.location.search).has('perf') && <output id="performance-readout" style={{ position: 'fixed', right: 16, top: 112, zIndex: 20, maxWidth: 330, padding: 10, background: '#18231eee', color: '#fff', font: '11px monospace', overflowWrap: 'anywhere', pointerEvents: 'none' }}>Measuring…</output>}
      <div className="stage" role="region" aria-label={`${room ? `${room.title.join(' ')} 3D` : 'Ngoại thất 3D'}. Dùng phím mũi tên để xoay, phím cộng và trừ để thu phóng.`} tabIndex={interactive ? 0 : -1} onKeyDown={handleKey}>
        <SceneBoundary onUnavailable={() => setStatus('unavailable')}>
          <ExteriorScene angle={angle} controls={controls} onReady={() => setStatus('ready')} onUnavailable={() => setStatus('unavailable')}
            markers={markers} showMarkers={showMarkers} moving={moving} reviewOpen={Boolean(item)} panelOpen={showRoomPanel} onSettled={() => setMoving(false)} onInspect={inspect} />
        </SceneBoundary>
        {unavailable && <div className="fallback-art" aria-hidden="true"><svg viewBox="0 0 500 280" fill="none"><path fill="#dddcca" d="M68 123 168 39l95 84v114H68z"/><path stroke="#ede7d7" strokeWidth="8" d="m65 125 103-88 101 88"/><circle cx="168" cy="88" r="11" fill="#3d4449" stroke="#b8c1a3" strokeWidth="5"/><path fill="#854b3c" d="M90 142h61v57H90zm90-3h51v96h-51z"/><path fill="#e3ded3" d="m160 150 66-66 68 66h-20q-43-53-83 0z"/><path stroke="#c5cbb0" strokeWidth="8" d="M178 150v86m99-86v86"/><path fill="#9b5147" d="m291 160 24-26h127l28 26z"/><path stroke="#a8a597" strokeWidth="15" d="M312 159v98m137-98v98"/><path stroke="#a8a597" strokeWidth="6" d="M48 253h418m-407-3v-55m15 55v-55m15 55v-55m15 55v-55m15 55v-55m15 55v-55m15 55v-55m15 55v-55m15 55v-55m15 55v-55m15 55v-55m15 55v-55m15 55v-55m15 55v-55m15 55v-55m15 55v-55"/></svg></div>}
      </div>
      <div className="shade" aria-hidden="true" />

      <header className="topbar">
        <div className="brand" aria-label="Nếp, ngôi nhà 3D">
          <span className="brand-icon"><Icon name="mark" size={25} /></span>
          <div><span className="brand-name">NẾP</span><span className="brand-caption">NHÀ TỪ ẢNH</span></div>
        </div>
        {inRoom ? <nav className="room-nav" aria-label="Ba phần bên trong nhà">
          {houseSections.map(section => <div className="room-nav-section" key={section.number}>
            <span>Phần {section.number}</span>
            <div>{section.rooms.map(candidate => <button key={candidate.id} type="button" disabled={!interactive}
              aria-current={candidate.id === angle ? 'true' : undefined} onClick={() => select(candidate.id)}>{candidate.label}</button>)}</div>
          </div>)}
        </nav> : <nav className="chapters" aria-label="Chọn góc nhìn theo ảnh">
          {viewpoints.map((item, position) => (
            <button key={item.id} type="button" aria-current={item.id === angle ? 'true' : undefined} disabled={!interactive} onClick={() => select(item.id)}>
              <span>{String(position + 1).padStart(2, '0')}</span> {item.label}
            </button>
          ))}
        </nav>}
        <button className="mode-button" type="button" disabled={!interactive} onClick={() => select(inRoom ? 'front' : entryRoom)}>
          {inRoom ? 'Ra ngoài' : 'Vào nhà'} <Icon name={inRoom ? 'left' : 'right'} size={16} />
        </button>
      </header>

      {inRoom ? <section className="story room-story" data-collapsed={!showRoomPanel ? 'true' : undefined} aria-label="Góc nhìn và đồ vật">
        <div className="eyebrow"><span /> Phần {room.section} · {room.fromPhotos ? 'Dựng theo ảnh' : 'Nội thất minh họa'}</div>
        <h1 id="chapter-title">{room.title[0]} <em>{room.title[1]}.</em></h1>
        <p>Chạm vào một món đồ hoặc chấm đánh dấu để đọc review và xem cận.</p>
        {room.photoViews && <div className="room-photo-views" role="group" aria-label={`Góc nhìn theo ảnh ${room.title.join(' ').toLowerCase()}`}>
          {room.photoViews.map(photo => <button key={photo.label} type="button" disabled={!interactive} onClick={() => {
            setSelection(null)
            if (catalog.current) catalog.current.open = false
            controls.current?.photoView(photo)
          }}>{photo.label}</button>)}
        </div>}
        <details className="room-catalog" ref={catalog}>
          <summary>Danh sách vật dụng</summary>
          <div>{itemsHere.map((entry, index) => <button key={entry.id} type="button" disabled={!interactive} onClick={() => inspect(entry.id)}><span className="catalog-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{entry.label}</button>)}</div>
        </details>
        <button className="room-panel-toggle" type="button" aria-expanded={showRoomPanel} onClick={() => setShowRoomPanel(!showRoomPanel)}>
          {showRoomPanel ? 'Thu gọn' : 'Góc nhìn & đồ vật'}
        </button>
      </section> : <section className="story exterior-story" data-collapsed={!showRoomPanel ? 'true' : undefined} aria-label="Góc nhìn ngoại thất">
        <div className="eyebrow"><span /> {detail ? 'Chi tiết' : `Ảnh ${number}`} / {view.label}</div>
        <h1 id="chapter-title">Ngôi nhà <em>của bạn.</em></h1>
        <p>{view.description}</p>
        {!unavailable && <>
          <button className="primary" type="button" disabled={!interactive} onClick={() => select(next)}>
            {detail ? 'Về góc ảnh' : 'Góc nhìn tiếp theo'}<Icon name={detail ? 'left' : 'right'} size={18} />
          </button>
          <div className="detail-group" role="group" aria-label="Góc xem gần">
            <span className="detail-label" aria-hidden="true">Xem gần</span>
            <div className="detail-options">
              {closeups.map(item => <button className="detail-button" key={item.id} type="button"
                aria-pressed={item.id === angle} disabled={!interactive} onClick={() => select(item.id)}>{item.label}</button>)}
            </div>
          </div>
        </>}
        <button className="room-panel-toggle" type="button" aria-expanded={showRoomPanel} onClick={() => setShowRoomPanel(!showRoomPanel)}>
          {showRoomPanel ? 'Thu gọn' : 'Xem chi tiết'}
        </button>
      </section>}

      {inRoom && interactive && showMarkers && <div className="room-markers" role="group" aria-label="Điểm đánh dấu vật dụng">
        {itemsHere.map((entry, position) => <button className="room-marker" type="button" key={entry.id}
          ref={node => { markers.current[entry.id] = node }} hidden aria-label={`Review ${entry.label}`} aria-pressed={selection === entry.id}
          onClick={() => inspect(entry.id)}>
          {String(position + 1).padStart(2, '0')}<span aria-hidden="true">{entry.label}</span>
        </button>)}
      </div>}
      {inRoom && interactive && item && <ReviewCard key={item.id} item={item} onClose={() => setSelection(null)} onFocus={(id, part) => controls.current?.focus(id, part)} />}

      {status !== 'ready' && (
        <div className="scene-status" role="status">
          {!unavailable && <span className="spinner" />}
          {unavailable ? 'Thiết bị này chưa thể hiển thị mô hình 3D.' : 'Đang dựng không gian 3D…'}
        </div>
      )}
      {moving && ready && <div className="scene-status" role="status"><span className="spinner" />{room ? `Đang đến ${room.title.join(' ').toLowerCase()}…` : 'Đang ra sân…'}</div>}

      <footer className="bottom-bar">
        {inRoom && <button className="marker-toggle" type="button" disabled={!interactive} aria-pressed={showMarkers}
          aria-label={showMarkers ? 'Ẩn số đồ vật' : 'Hiện số đồ vật'} onClick={() => setShowMarkers(value => !value)}>
          <span aria-hidden="true" className="marker-toggle-icon">01</span>{showMarkers ? 'Ẩn số' : 'Hiện số'}
        </button>}
        <div className="scene-index">{room ? <span>PHẦN {room.section}</span> : detail ? <span>XEM GẦN</span> : <><span>{number}</span><i /> 04</>}</div>
        {ready && <div className="help"><Icon name="move" size={15} /><span className="mouse-hint">Kéo để xoay <b>·</b> Cuộn để thu phóng</span><span className="touch-hint">Vuốt để xoay <b>·</b> Chụm để thu phóng</span></div>}
        <div className="tools" role="group" aria-label="Điều khiển camera">
          <button type="button" disabled={!interactive} title="Phóng to" aria-label="Phóng to" onClick={() => controls.current?.zoom(0.87)}><Icon name="plus" size={18} /></button>
          <button type="button" disabled={!interactive} title="Thu nhỏ" aria-label="Thu nhỏ" onClick={() => controls.current?.zoom(1.15)}><Icon name="minus" size={18} /></button>
          <button type="button" disabled={!interactive} title="Đặt lại góc nhìn" aria-label="Đặt lại góc nhìn" onClick={() => controls.current?.reset()}><Icon name="reset" size={17} /></button>
        </div>
      </footer>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
