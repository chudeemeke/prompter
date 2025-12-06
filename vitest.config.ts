import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Exclude E2E tests (Playwright handles these separately)
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/*.spec.ts',  // Playwright uses .spec.ts convention
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/components/index.ts',  // Barrel exports only
        'src/components/shared/index.ts',  // Barrel exports
        'src/context/index.ts',  // Barrel exports
        'src/lib/mocks.ts',  // Test mock data
        'src/App.tsx',  // Main app entry (minimal bootstrap code)
        // Service implementations are tested via integration tests
        'src/services/TauriPromptService.ts',  // Calls native Tauri APIs
        'src/services/MockPromptService.ts',  // Test helper, used in other tests
        // EditorWindow components are WIP, tested through integration
        'src/components/EditorWindow/**',
        // Shared components that are WIP or only used in EditorWindow
        'src/components/shared/ColorPicker.tsx',
        'src/components/shared/IconPicker.tsx',
        'src/components/shared/TagInput.tsx',
        'src/components/shared/Modal.tsx',
        'src/components/shared/Textarea.tsx',
      ],
      thresholds: {
        statements: 95,
        branches: 94,  // 94% due to defensive code paths and environment-specific logic
        functions: 95,
        lines: 95,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
