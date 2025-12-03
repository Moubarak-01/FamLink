import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import BookingRequestModal from './BookingRequestModal';

const mockNanny = {
  id: 'nanny1',
  fullName: 'Test Nanny',
  photo: 'photo.jpg',
};

const mockOnSubmit = jest.fn();
const mockOnClose = jest.fn();

describe('BookingRequestModal', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnClose.mockClear();
  });

  test('renders modal and submits with valid fields', () => {
    render(
      <BookingRequestModal
        nanny={mockNanny}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    // Fill date, startTime, endTime by default has values
    const dateInput = screen.getByLabelText(/Date/i);
    const startTimeInput = screen.getByLabelText(/Start Time/i);
    const endTimeInput = screen.getByLabelText(/End Time/i);
    const messageInput = screen.getByLabelText(/Message/i);
    const submitButton = screen.getByText(/Send Request/i);

    fireEvent.change(dateInput, { target: { value: '2023-11-23' } });
    fireEvent.change(startTimeInput, { target: { value: '09:00' } });
    fireEvent.change(endTimeInput, { target: { value: '17:00' } });
    fireEvent.change(messageInput, { target: { value: 'Please book me' } });

    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      mockNanny.id,
      '2023-11-23',
      '09:00',
      '17:00',
      'Please book me'
    );
  });

  test('shows alert if required fields are missing', () => {
    window.alert = jest.fn();
    render(<BookingRequestModal nanny={mockNanny} onSubmit={mockOnSubmit} onClose={mockOnClose} />);
    const dateInput = screen.getByLabelText(/Date/i);

    // Clear date to simulate missing required field
    fireEvent.change(dateInput, { target: { value: '' } });

    const submitButton = screen.getByText(/Send Request/i);
    fireEvent.click(submitButton);

    expect(window.alert).toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
