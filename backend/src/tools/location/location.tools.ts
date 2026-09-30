import { z } from 'zod';
import { Tool, RiskLevel } from '../types.js';
import { locationService } from '../../services/location.service.js';
import { workerService } from '../../services/worker.service.js';

export const getDistanceTool: Tool = {
  name: 'get_distance',
  description: 'Calculate distance in kilometers between two geo coordinates',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [],
  permissions: [],
  requireAuth: false,
  inputSchema: z.object({
    origin: z.object({ latitude: z.number(), longitude: z.number() }),
    destination: z.object({ latitude: z.number(), longitude: z.number() }),
  }),
  async execute(input) {
    const distanceKm = locationService.calculateDistance(input.origin, input.destination);
    return { distanceKm };
  },
};

export const getRouteTool: Tool = {
  name: 'get_route',
  description: 'Calculate route distance, estimated travel time (ETA), and polyline',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [],
  permissions: [],
  requireAuth: false,
  inputSchema: z.object({
    origin: z.object({ latitude: z.number(), longitude: z.number() }),
    destination: z.object({ latitude: z.number(), longitude: z.number() }),
  }),
  async execute(input) {
    return locationService.getRoute(input.origin, input.destination);
  },
};

export const getEtaTool: Tool = {
  name: 'get_eta',
  description: 'Calculate Estimated Time of Arrival (ETA) in minutes for a worker en route',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [],
  permissions: [],
  requireAuth: false,
  inputSchema: z.object({
    origin: z.object({ latitude: z.number(), longitude: z.number() }),
    destination: z.object({ latitude: z.number(), longitude: z.number() }),
  }),
  async execute(input) {
    const route = await locationService.getRoute(input.origin, input.destination);
    return {
      etaMinutes: route.durationMinutes,
      distanceKm: route.distanceKm,
    };
  },
};

export const findNearbyWorkersTool: Tool = {
  name: 'find_nearby_workers',
  description: 'Find verified workers within a specified kilometer radius',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [],
  permissions: [],
  requireAuth: false,
  inputSchema: z.object({
    city: z.string(),
    trade: z.string().optional(),
    radiusKm: z.number().default(25),
  }),
  async execute(input) {
    return workerService.searchWorkers({
      city: input.city,
      trade: input.trade,
      availableOnly: true,
    });
  },
};
