import { toolRegistry } from './registry.js';
import {
  searchWorkersTool,
  getWorkerTool,
  checkWorkerAvailabilityTool,
  updateWorkerProfileTool,
  updateWorkerAvailabilityTool,
} from './workers/worker.tools.js';
import {
  createBookingTool,
  getBookingTool,
  getMyBookingsTool,
  acceptBookingTool,
  rejectBookingTool,
  cancelBookingTool,
  startBookingTool,
  markArrivedTool,
  completeBookingTool,
  updateBookingStatusTool,
} from './bookings/booking.tools.js';
import {
  createJobTool,
  getJobTool,
  searchJobsTool,
  applyJobTool,
  getJobApplicationsTool,
  acceptApplicationTool,
  rejectApplicationTool,
} from './jobs/job.tools.js';
import {
  createReviewTool,
  getWorkerReviewsTool,
} from './reviews/review.tools.js';
import {
  getDistanceTool,
  getRouteTool,
  getEtaTool,
  findNearbyWorkersTool,
} from './location/location.tools.js';
import {
  adminApproveWorkerTool,
  adminRejectWorkerTool,
  adminSuspendWorkerTool,
  adminSuspendUserTool,
  adminVerifyDocumentTool,
  adminResolveDisputeTool,
  adminGetStatsTool,
} from './admin/admin.tools.js';

export function registerAllTools() {
  const tools = [
    // Worker Tools
    searchWorkersTool,
    getWorkerTool,
    checkWorkerAvailabilityTool,
    updateWorkerProfileTool,
    updateWorkerAvailabilityTool,
    // Booking Tools
    createBookingTool,
    getBookingTool,
    getMyBookingsTool,
    acceptBookingTool,
    rejectBookingTool,
    cancelBookingTool,
    startBookingTool,
    markArrivedTool,
    completeBookingTool,
    updateBookingStatusTool,
    // Job Tools
    createJobTool,
    getJobTool,
    searchJobsTool,
    applyJobTool,
    getJobApplicationsTool,
    acceptApplicationTool,
    rejectApplicationTool,
    // Review Tools
    createReviewTool,
    getWorkerReviewsTool,
    // Location Tools
    getDistanceTool,
    getRouteTool,
    getEtaTool,
    findNearbyWorkersTool,
    // Admin Tools
    adminApproveWorkerTool,
    adminRejectWorkerTool,
    adminSuspendWorkerTool,
    adminSuspendUserTool,
    adminVerifyDocumentTool,
    adminResolveDisputeTool,
    adminGetStatsTool,
  ];

  for (const tool of tools) {
    if (!toolRegistry.has(tool.name)) {
      toolRegistry.register(tool);
    }
  }

  console.log(`✅ Registered ${tools.length} system tools in ToolRegistry.`);
}
