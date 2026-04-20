import { sendAgentChat } from '../api/api'

export async function sendAgentChatMessage(message, context) {
  return sendAgentChat(message, context)
}
