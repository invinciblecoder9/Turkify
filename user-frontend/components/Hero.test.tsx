// user-frontend/components/Hero.test.tsx
import { render, screen } from '@testing-library/react';
import { Hero } from './Hero'; // Adjust path if needed

describe('Hero', () => {
  it('renders the welcome message', () => {
    render(<Hero />);
    const welcomeMessage = screen.getByText(/Welcome to Turkify/i);
    expect(welcomeMessage).toBeInTheDocument();
  });

  it('renders the subtitle text', () => {
    render(<Hero />);
    const subtitle = screen.getByText(/Your one-stop destination to getting your data labelled efficiently and accurately./i);
    expect(subtitle).toBeInTheDocument();
  });
});