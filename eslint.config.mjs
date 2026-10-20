import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/purity': 'error',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Исключения для парсеров внешнего JSON
  {
    files: [
      'src/lib/srd/**/*.ts',
      'src/lib/queries/srd.ts',
      'src/lib/actions/bestiary*.ts',
      'src/lib/actions/spells-search.ts',
      'src/lib/actions/items-search.ts',
      'src/lib/actions/add-item-to-*.ts',
      'src/lib/actions/add-spell-to-character.ts',
      'src/lib/queries/backlinks.ts',
      'src/lib/queries/music.ts',
      'src/lib/dnd/srd-adapter.ts',
      'scripts/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // CHANGES: экранированы [id] и [sceneId] — иначе ESLint не матчит пути.
  // Без экранирования `[id]` интерпретируется как символьный класс.
  {
    files: [
      'src/app/campaign/\\[id\\]/scenes/**/*.tsx',
      'src/app/campaign/\\[id\\]/handouts/**/*.tsx',
      'src/app/campaign/\\[id\\]/scenes/\\[sceneId\\]/**/*.tsx',
      'src/app/dashboard/page.tsx',
      'src/app/settings/avatar-uploader.tsx',
    ],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },

  // Исключения для hook-файлов — set-state-in-effect починим постепенно
  {
    files: ['src/lib/hooks/use-realtime-*.ts'],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])

export default eslintConfig