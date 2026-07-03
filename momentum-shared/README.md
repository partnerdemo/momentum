# momentum-shared

Platform-agnostic **business logic, types, and utilities** for the Momentum ecosystem. Consumed by `momentum-web` and `momentum-mobile` via npm workspace link.

> **No React components live here.** This package exports `.ts` only (logic + types). Web (React 18.3) and mobile (React Native + React 19.1) each render their own UI on top of these shared primitives. Do not add a `.tsx` file here — put rendering in the consumer.

## What's inside

```
momentum-shared/
├── components/
│   ├── MemberAvatar/{logic,types}.ts
│   ├── TaskCard/{logic,types}.ts
│   ├── Quest/{logic,types}.ts
│   ├── StoreItem/{logic,types}.ts
│   └── Modal/{logic,types}.ts
├── utils/
│   ├── colors.ts         # hex→rgb, opacity, brightness adjust
│   ├── formatting.ts     # dates, numbers, time
│   ├── validation.ts     # email, url, color
│   └── helpers.ts        # id gen, debounce, throttle, deep clone, sorting
└── index.ts              # central re-export
```

## How to add shared logic

1. Create `components/<Name>/logic.ts` and `components/<Name>/types.ts`
2. Add `export * from './components/<Name>/...'` to `index.ts`
3. Keep it pure — no side effects, no platform-specific imports
4. Verify it builds on both consumers: `npm run dev:web` and `npm run dev:mobile`

## Commands

```bash
npm run type-check      # tsc --noEmit
npm run test            # jest (currently empty)
```

## For deeper context

See the canonical doc: [../MOMENTUM.md](../MOMENTUM.md) §1.8.
