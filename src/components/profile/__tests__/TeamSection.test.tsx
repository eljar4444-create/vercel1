import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { TeamSection } from '@/components/profile/TeamSection';

describe('TeamSection', () => {
    it('returns null if empty specialists array', () => {
        const { container } = render(<TeamSection specialists={[]} />);
        expect(container.innerHTML).toBe('');
    });

    it('renders "Команда" header and SpecialistCards', () => {
        render(
            <TeamSection
                specialists={[
                    { id: '1', name: 'Мария', photos: [] },
                    { id: '2', name: 'Анна', photos: [] },
                ]}
            />
        );
        expect(screen.getByText('Команда')).toBeTruthy();
        expect(screen.getByText('Мария')).toBeTruthy();
        expect(screen.getByText('Анна')).toBeTruthy();
    });
});
