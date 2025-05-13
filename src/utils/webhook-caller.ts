
// Re-export webhook-related functions from the stub module
// These could be replaced with real webhook calling implementations later
export { callWebhookDirectly, verifyWebhookConfiguration } from './notification-stub';
