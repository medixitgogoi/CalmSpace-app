import { useMemo } from 'react';
import { Filter } from 'bad-words';

/**
 * Reusable hook for content moderation across Calmspace.
 * Supports a wide range of Indian slangs and phonetic variations.
 */
export const useContentFilter = () => {
    const indianBadWords = [
        // Core Hindi Slurs & Variations
        'chutiya', 'chutiye', 'chuitye', 'chutya', 'chotya',
        'gandu', 'ganduo', 'gaandu',
        'harami', 'haramzade', 'haramzada',
        'saala', 'saale', 'sala', 'sale',
        'kamina', 'kamine',
        'randi', 'randaap', 'randwe',
        'bhadwa', 'bhadwe',
        'kutta', 'kutte', 'kaminey',

        // Severe Slurs (Hinglish variations)
        'behenchod', 'bhenchod', 'benchod', 'bhanchod', 'behenchodd', 'bc',
        'madarchod', 'maderchod', 'madarchodd', 'mc',
        'betichod', 'bhetichod',
        'bhosdike', 'bhosadi', 'bhosadike', 'bhosda', 'bsdk', 'bhosidike',
        'loda', 'lauda', 'lowda', 'lund', 'lunday',
        'gaand', 'gand', 'gaandfat', 'gnd',
        'muth', 'muthal', 'muthiya',
        'tatte', 'tatta',

        // Regional & Other Slangs
        'bakchod', 'bakchodi',
        'jhantu', 'jhaantu',
        'chinal', 'chinaal',
        'lavde', 'lawde',
        'paki', 'kulla', 'tharki',
        'hijra', 'meetha', // Used as slurs
    ];

    const filter = useMemo(() => {
        const newFilter = new Filter();
        // Programmatically inject the expanded list
        newFilter.addWords(...indianBadWords);
        return newFilter;
    }, []);

    const checkContent = (text, onViolation) => {
        if (!text || !text.trim()) return true;

        // Normalize text to lowercase and remove common bypass characters like dots/stars
        const normalizedText = text.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "");

        if (filter.isProfane(normalizedText)) {
            if (onViolation) {
                onViolation();
            }
            return false;
        }

        return true;
    };

    return { checkContent, filter };
};