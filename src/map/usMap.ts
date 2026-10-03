import { geoPath } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { GeometryCollection, Topology } from 'topojson-specification'
import { feature } from 'topojson-client'
import atlas from 'us-atlas/states-albers-10m.json'
import { STATES } from '../engine/data/states'

export interface MapShape {
  index: number
  name: string
  d: string
  cx: number
  cy: number
  area: number
}

export const MAP_VIEWBOX = '-60 6 1020 606'

// The atlas is already projected (Albers USA with Alaska and Hawaii insets), so no projection is needed.
const topology = atlas as unknown as Topology
const collection = feature(topology, topology.objects.states as GeometryCollection) as FeatureCollection<
  Geometry,
  { name: string }
>
const path = geoPath()

export const MAP_SHAPES: MapShape[] = collection.features.flatMap((f: Feature<Geometry, { name: string }>) => {
  const index = STATES.findIndex((s) => s.name === f.properties.name)
  if (index < 0) return []

  const [cx, cy] = path.centroid(f)
  return [{ index, name: f.properties.name, d: path(f) ?? '', cx, cy, area: path.area(f) }]
})
