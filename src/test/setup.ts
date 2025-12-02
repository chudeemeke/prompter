import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Vitest v4+ compatibility: Extend expect with jest-dom matchers
expect.extend(matchers);

// Mock browser APIs not implemented in jsdom
Element.prototype.scrollIntoView = () => {};

// Ensure matchers are available globally
// @ts-ignore - Global augmentation for vitest
globalThis.expect = expect;
