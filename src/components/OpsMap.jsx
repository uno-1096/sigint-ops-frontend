import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const SEVERITY_COLORS = {
  critical:   0xe24b4a,
  elevated:   0xef9f27,
  monitor:    0x378add,
  earthquake: 0xb077dd,
}

function latLonToVec3(lat, lon, radius) {
  const phi   = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  )
}

export default function GlobeMap({ incidents }) {
  const mountRef  = useRef(null)
  const stateRef  = useRef({})
  const [popup, setPopup] = useState(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    const W = el.clientWidth, H = el.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000)
    camera.position.z = 2.6

    scene.add(new THREE.AmbientLight(0x444444))
    const sun = new THREE.DirectionalLight(0xffffff, 1.1)
    sun.position.set(5, 3, 5)
    scene.add(sun)

    // Globe
    const loader  = new THREE.TextureLoader()
    const globe   = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshPhongMaterial({
        map: loader.load('/textures/earth-night.jpg'),
        specular: new THREE.Color(0x222222), shininess: 10
      })
    )
    scene.add(globe)

    // Atmosphere
    const atm = new THREE.Mesh(
      new THREE.SphereGeometry(1.03, 64, 64),
      new THREE.MeshPhongMaterial({ color: 0x0033aa, transparent: true, opacity: 0.07, side: THREE.FrontSide })
    )
    scene.add(atm)

    // Stars
    const sv = []
    for (let i = 0; i < 8000; i++) {
      sv.push((Math.random()-0.5)*600, (Math.random()-0.5)*600, (Math.random()-0.5)*600)
    }
    const sg = new THREE.BufferGeometry()
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3))
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25 })))

    // Pin group — child of globe so pins rotate with it
    const pinGroup = new THREE.Group()
    globe.add(pinGroup)

    stateRef.current = { scene, globe, pinGroup, renderer, camera }

    // Drag + inertia
    let dragging = false, prevX = 0, prevY = 0, velX = 0, velY = 0

    const onDown = e => { dragging = true; prevX = e.clientX; prevY = e.clientY; velX = 0; velY = 0 }
    const onUp   = ()  => { dragging = false }
    const onMove = e  => {
      if (!dragging) return
      velX = (e.clientX - prevX) * 0.005
      velY = (e.clientY - prevY) * 0.005
      prevX = e.clientX; prevY = e.clientY
    }

    // Raycaster for pin clicks
    const raycaster = new THREE.Raycaster()
    const mouse     = new THREE.Vector2()
    const onClick   = e => {
      const rect = el.getBoundingClientRect()
      mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1
      mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(pinGroup.children, true)
      if (hits.length > 0) {
        const obj = hits[0].object
        if (obj.userData.incident) {
          setPopup({ incident: obj.userData.incident, x: e.clientX - rect.left, y: e.clientY - rect.top })
        }
      } else {
        setPopup(null)
      }
    }

    el.addEventListener('mousedown', onDown)
    el.addEventListener('click', onClick)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('mousemove', onMove)

    let rotX = 0.1, rotY = 0, animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      if (dragging) {
        rotY += velX; rotX += velY
      } else {
        velX *= 0.92; velY *= 0.92
        rotY += velX; rotX += velY
        rotY += 0.0018
      }
      rotX = Math.max(-1.2, Math.min(1.2, rotX))
      globe.rotation.y = rotY
      globe.rotation.x = rotX
      atm.rotation.copy(globe.rotation)
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      el.removeEventListener('mousedown', onDown)
      el.removeEventListener('click', onClick)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  // Rebuild pins when incidents change
  useEffect(() => {
    const { pinGroup } = stateRef.current
    if (!pinGroup) return

    // Clear old pins
    while (pinGroup.children.length) pinGroup.remove(pinGroup.children[0])

    incidents.forEach(inc => {
      const color = SEVERITY_COLORS[inc.type === 'earthquake' ? 'earthquake' : inc.severity] || SEVERITY_COLORS.monitor
      const pos   = latLonToVec3(inc.lat, inc.lon, 1.0)
      const dir   = pos.clone().normalize()

      // Spike
      const spike = new THREE.Mesh(
        new THREE.CylinderGeometry(0, 0.007, 0.045, 6),
        new THREE.MeshBasicMaterial({ color })
      )
      spike.position.copy(pos)
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
      spike.userData.incident = inc
      pinGroup.add(spike)

      // Glow dot
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.009, 8, 8),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
      )
      dot.position.copy(dir.multiplyScalar(1.018))
      dot.userData.incident = inc
      pinGroup.add(dot)
    })
  }, [incidents])

  const tagColor = { critical:'#e24b4a', elevated:'#ef9f27', monitor:'#378add', earthquake:'#b077dd' }

  return (
    <div className="panel" style={{ position: 'relative' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', gap: 8 }}>
          {['Globe','Aircraft','Naval','Weather'].map((l, i) => (
            <span key={l} style={{
              fontSize: 9, padding: '2px 7px', borderRadius: 2, cursor: 'pointer',
              color: i === 0 ? '#378add' : '#2a3a4a',
              border: i === 0 ? '1px solid #1e3a55' : '1px solid transparent',
              background: i === 0 ? '#0a1825' : 'transparent',
            }}>{l}</span>
          ))}
        </div>
        <span style={{ fontSize: 9, color: '#378add' }}>{incidents.length} PLOTTED</span>
      </div>

      <div ref={mountRef} style={{ flex: 1, cursor: 'grab', background: '#020408', position: 'relative' }} />

      {/* Popup */}
      {popup && (
        <div style={{
          position: 'absolute',
          left: Math.min(popup.x + 10, 300),
          top: Math.max(popup.y - 60, 40),
          background: '#0d1117', border: '1px solid #1e2530',
          borderLeft: '2px solid ' + (tagColor[popup.incident.type === 'earthquake' ? 'earthquake' : popup.incident.severity] || '#378add'),
          borderRadius: 3, padding: '8px 10px', zIndex: 100,
          maxWidth: 200, pointerEvents: 'none'
        }}>
          <div style={{ fontSize: 8, color: '#378add', marginBottom: 3 }}>
            {popup.incident.type === 'earthquake' ? 'SEISMIC EVENT' : popup.incident.severity?.toUpperCase()}
          </div>
          <div style={{ fontSize: 9, color: '#c8cfd8', lineHeight: 1.4 }}>
            {popup.incident.title}
          </div>
          {popup.incident.mag && (
            <div style={{ fontSize: 8, color: '#b077dd', marginTop: 3 }}>M{popup.incident.mag?.toFixed(1)}</div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 10, left: 10, zIndex: 10,
        background: '#0d111799', padding: '6px 8px', borderRadius: 3,
        border: '1px solid #1e2530', display: 'flex', flexDirection: 'column', gap: 4
      }}>
        {[['critical','#e24b4a'],['elevated','#ef9f27'],['monitor','#378add'],['seismic','#b077dd']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 8, color: '#3a4a58', textTransform: 'uppercase' }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 10, fontSize: 8, color: '#1e2f40' }}>
        DRAG TO ROTATE · CLICK PIN FOR DETAILS
      </div>
    </div>
  )
}
