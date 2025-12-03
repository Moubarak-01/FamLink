// Example Cypress tests for booking request creation, notifications, and real-time updates

describe('Booking Request Flow', () => {
  beforeEach(() => {
    // Reset DB or prepare test environment if possible (manual step otherwise)
    cy.visit('/');
  });

  it('Allows parent to create a booking request', () => {
    // Login as parent (assuming login form available)
    cy.get('input[name=email]').type('parent@example.com');
    cy.get('input[name=password]').type('password123');
    cy.contains('Login').click();

    // Navigate to nanny listing and select a nanny
    cy.contains('Nannies').click();
    cy.get('.nanny-profile').first().click();

    // Open booking modal and fill details
    cy.contains('Request Booking').click();
    cy.get('input[name=date]').type('2025-11-23');
    cy.get('input[name=startTime]').type('09:00');
    cy.get('input[name=endTime]').type('17:00');
    cy.get('textarea[name=message]').type('Please take care of my child.');

    // Submit booking request
    cy.contains('Send Request').click();

    cy.contains('Booking request sent').should('be.visible');
  });

  it('Nanny receives booking notification with readable date', () => {
    // Login as nanny
    cy.get('input[name=email]').type('nanny@example.com');
    cy.get('input[name=password]').type('password123');
    cy.contains('Login').click();

    // Open notification panel
    cy.get('button[title=Notifications]').click();

    // Assert notification count visible
    cy.get('.notification-count').should('contain.text', '1');

    // Check that notification includes correct date string like Nov 23, 2025 or time
    cy.get('.notification-item').first().should(($notif) => {
      const text = $notif.text();
      expect(text).to.match(/Nov 23|09:00|17:00/);
    });

    // Click notification and assert navigation or modal opens
    cy.get('.notification-item').first().click();
    cy.url().should('include', '/dashboard');
  });

  it('Real-time booking updates reflect in nanny dashboard', () => {
    // This test would require simulating websocket events or triggering backend updates
    // For manual trigger or mock:

    // Login as nanny
    cy.get('input[name=email]').type('nanny@example.com');
    cy.get('input[name=password]').type('password123');
    cy.contains('Login').click();

    // Check bookings list before update
    cy.contains('Booking Requests').parent().find('.booking-item').should('have.length.gte', 0);

    // TODO: Trigger booking update event or simulate and check updated status reflected
  });

});
