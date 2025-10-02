export interface DebrisObject {
  id: string
  name: string
  position: [number, number, number]
  velocity: [number, number, number]
  size: number
  mass: number
  type: "satellite" | "rocket_body" | "fragment" | "unknown"
  launchDate?: string
  country?: string
  apogee: number
  perigee: number
  inclination: number
  period: number
  eccentricity: number
  rcs: number // Radar Cross Section
  status: "active" | "inactive" | "decayed"
  lastUpdate: string
}

export interface NASADebrisResponse {
  data: DebrisObject[]
  totalCount: number
  lastUpdated: string
}

export interface DebrisStatistics {
  totalObjects: number
  trackableObjects: number
  activeSatellites: number
  inactiveSatellites: number
  rocketBodies: number
  fragments: number
  byAltitude: {
    leo: number
    meo: number
    geo: number
  }
  bySize: {
    large: number
    medium: number
    small: number
  }
  collisionRisk: string
  lastUpdate: string
}

class NASADebrisClient {
  async getDebrisData(params?: {
    altitude?: [number, number]
    size?: [number, number]
    limit?: number
    type?: string[]
  }): Promise<NASADebrisResponse> {
    const searchParams = new URLSearchParams()

    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.altitude) {
      searchParams.set("altitudeMin", params.altitude[0].toString())
      searchParams.set("altitudeMax", params.altitude[1].toString())
    }

    const response = await fetch(`/api/nasa/debris?${searchParams}`)
    if (!response.ok) {
      throw new Error("Failed to fetch debris data")
    }

    return response.json()
  }

  async getDebrisStatistics(): Promise<DebrisStatistics> {
    const response = await fetch("/api/nasa/statistics")
    if (!response.ok) {
      throw new Error("Failed to fetch debris statistics")
    }

    const stats = (await response.json()) as DebrisStatistics
    return stats
  }
}

export const nasaDebrisClient = new NASADebrisClient()
