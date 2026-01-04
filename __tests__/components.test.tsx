/**
 * Component tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HashDisplay from '@/components/HashDisplay';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('HashDisplay', () => {
  const testHash = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';

  it('should render full hash', () => {
    render(<HashDisplay hash={testHash} />);
    expect(screen.getByText(testHash)).toBeInTheDocument();
  });

  it('should render truncated hash when truncate prop is true', () => {
    render(<HashDisplay hash={testHash} truncate />);
    const displayed = screen.getByRole('code');
    expect(displayed.textContent).toContain('...');
    expect(displayed.textContent).toContain(testHash.slice(0, 16));
    expect(displayed.textContent).toContain(testHash.slice(-16));
  });

  it('should render custom label', () => {
    render(<HashDisplay hash={testHash} label="Custom Label" />);
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('should copy hash to clipboard when button clicked', async () => {
    render(<HashDisplay hash={testHash} />);
    const copyButton = screen.getByTitle('Copy to clipboard');
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testHash);
    });
  });

  it('should show checkmark after copying', async () => {
    render(<HashDisplay hash={testHash} />);
    const copyButton = screen.getByTitle('Copy to clipboard');
    fireEvent.click(copyButton);
    
    // The checkmark SVG should appear
    await waitFor(() => {
      const svg = copyButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});

