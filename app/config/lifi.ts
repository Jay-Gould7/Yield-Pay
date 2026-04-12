import { createConfig } from '@lifi/sdk'

// TODO: Integrate with useLifi hooks in Phase 2
export const lifiConfig = createConfig({
  integrator: 'Yield-Pay',
  apiKey: process.env.LIFI_API_KEY,
})
