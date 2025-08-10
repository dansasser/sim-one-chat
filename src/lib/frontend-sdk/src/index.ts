/**
 * AgentUI Frontend SDK with SIM-ONE Framework Integration
 * 
 * Main entry point for the AgentUI Frontend SDK.
 * Provides universal AI processing through SIM-ONE Framework and comprehensive frontend integration.
 * 
 * Features:
 * - Framework-agnostic design (React, Vue, Astro, vanilla JS)
 * - Multiple authentication methods
 * - Component creation and management
 * - Universal AI processing through SIM-ONE five-agent pipeline
 * - Real-time API communication and event handling
 */

// Main client
export { AgentUIClient } from './client/agentui-client';

// Services
export { AuthService } from './services/auth-service';
export { ComponentService } from './services/component-service';
export { SIMONEService } from './services/simone-service';

// Types
export * from './types/client-types';
export * from './services/simone-service';

// Utilities
export { Logger } from './utils/logger';

