import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import land110 from 'world-atlas/land-110m.json'

/**
 * Builds an equirectangular land mask from Natural Earth (world-atlas, 1:110m)
 * and samples a Fibonacci sphere against it. Result: evenly spaced dots that
 * trace real coastlines, with no texture download and no UV seam.
 */
function buildMask(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#fff'

  const topo = land110 as unknown as Topology<{ land: GeometryCollection }>
  const geo = feature(topo, topo.objects.land) as GeoJSON.FeatureCollection
  const toX = (lon: number) => ((lon + 180) / 360) * w
  const toY = (lat: number) => ((90 - lat) / 180) * h

  const drawPolygon = (rings: number[][][]) => {
    ctx.beginPath()
    for (const ring of rings) {
      let prevLon = ring[0][0]
      ring.forEach(([lon, lat], i) => {
        // avoid a stroke across the whole map where a ring touches the antimeridian
        if (i === 0 || Math.abs(lon - prevLon) > 180) ctx.moveTo(toX(lon), toY(lat))
        else ctx.lineTo(toX(lon), toY(lat))
        prevLon = lon
      })
      ctx.closePath()
    }
    ctx.fill('evenodd')
  }

  for (const f of geo.features) {
    const g = f.geometry
    if (g.type === 'Polygon') drawPolygon(g.coordinates as number[][][])
    else if (g.type === 'MultiPolygon')
      for (const poly of g.coordinates as number[][][][]) drawPolygon(poly)
  }
  return { data: ctx.getImageData(0, 0, w, h).data, w, h }
}

export type LandCloud = {
  positions: Float32Array
  rand: Float32Array
  count: number
}

export function buildLandCloud(samples: number, radius: number): LandCloud {
  const { data, w, h } = buildMask(1440, 720)
  const pos: number[] = []
  const rnd: number[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    const x = Math.cos(theta) * r
    const z = Math.sin(theta) * r

    const lat = Math.asin(y) * (180 / Math.PI)
    // three.js: +z faces the camera; longitude 0 placed on +z
    const lon = Math.atan2(x, z) * (180 / Math.PI)
    const px = Math.min(w - 1, Math.max(0, Math.floor(((lon + 180) / 360) * w)))
    const py = Math.min(h - 1, Math.max(0, Math.floor(((90 - lat) / 180) * h)))
    if (data[(py * w + px) * 4] > 127) {
      pos.push(x * radius, y * radius, z * radius)
      rnd.push(Math.random())
    }
  }
  return {
    positions: new Float32Array(pos),
    rand: new Float32Array(rnd),
    count: rnd.length,
  }
}
