const admin = require('firebase-admin');
const { db } = require('./firebaseService');

const COLLECTION_NAME = 'support_tickets';

/**
 * Retrieves or creates a ticket for a given session.
 * @param {string} sessionId
 * @param {string} [userEmail]
 */
exports.getOrCreateTicket = async (sessionId, userEmail = null) => {
  try {
    const ticketsRef = db.collection(COLLECTION_NAME);
    const q = ticketsRef.where('sessionId', '==', sessionId).limit(1);
    const snapshot = await q.get();

    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }

    // Create new ticket
    const newTicket = {
      sessionId,
      userEmail,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      interactions: [],
      priority: 'NORMAL',
      issue_type: 'UNKNOWN',
      sentiment_history: [] // Track sentiment over time
    };

    const docRef = await ticketsRef.add(newTicket);
    return { id: docRef.id, ...newTicket };
  } catch (error) {
    console.error('[TicketService] Error getting/creating ticket:', error);
    throw error;
  }
};

/**
 * Logs a message interaction to the ticket.
 * @param {string} ticketId
 * @param {string} role 'user' | 'model' | 'system'
 * @param {string} text
 */
exports.logInteraction = async (ticketId, role, text) => {
  try {
    const ticketRef = db.collection(COLLECTION_NAME).doc(ticketId);
    await ticketRef.update({
      interactions: admin.firestore.FieldValue.arrayUnion({
        role,
        text,
        timestamp: new Date().toISOString()
      }),
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TicketService] Error logging interaction:', error);
  }
};

/**
 * Updates ticket intelligence (Sentiment, Type, Priority).
 * @param {string} ticketId
 * @param {object} analysis { sentiment: number, type: string, priority: string, summary: string }
 */
exports.updateIntelligence = async (ticketId, analysis) => {
  try {
    const updates = {
      last_updated: new Date().toISOString()
    };
    if (analysis.sentiment !== undefined) updates.sentiment_current = analysis.sentiment;
    if (analysis.type) updates.issue_type = analysis.type;
    if (analysis.priority) updates.priority = analysis.priority;
    if (analysis.summary) updates.summary = analysis.summary;

    await db.collection(COLLECTION_NAME).doc(ticketId).update(updates);
  } catch (error) {
    console.error('[TicketService] Error updating intelligence:', error);
  }
};

/**
 * Escalates a ticket.
 * @param {string} ticketId
 * @param {string} reason
 */
exports.escalateTicket = async (ticketId, reason) => {
  try {
    await db.collection(COLLECTION_NAME).doc(ticketId).update({
      status: 'ESCALATED',
      escalation_reason: reason,
      last_updated: new Date().toISOString(),
      priority: 'HIGH'
    });
    console.log(`[TicketService] Ticket ${ticketId} ESCALATED: ${reason}`);
  } catch (error) {
    console.error('[TicketService] Error escalating:', error);
  }
};
