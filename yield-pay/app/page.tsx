'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Home() {
  return (
    <div className='flex min-h-screen flex-col'>
      {/* Header */}
      <header className='border-b border-zinc-200 dark:border-zinc-800'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-2'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500'>
              <svg
                className='h-5 w-5 text-white'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                />
              </svg>
            </div>
            <span className='text-xl font-bold text-zinc-900 dark:text-white'>
              Yield-Pay
            </span>
          </div>

          <ConnectButton
            chainStatus='icon'
            showBalance={false}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </div>
      </header>

      {/* Hero Section */}
      <main className='flex flex-1 items-center justify-center px-4 py-20'>
        <div className='mx-auto max-w-3xl text-center'>
          <h1 className='text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl'>
            让 Gas Fee 消失在未来的收益里
          </h1>
          <p className='mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400'>
            零成本跨链存款 · 收益即时覆盖手续费
          </p>
          <div className='mt-10 flex items-center justify-center gap-x-6'>
            <a
              href='/deposit'
              className='rounded-full bg-indigo-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500'
            >
              开始体验
            </a>
            <a
              href='https://docs.li.fi'
              target='_blank'
              rel='noopener noreferrer'
              className='text-sm font-semibold text-zinc-900 dark:text-white'
            >
              了解更多 →
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='border-t border-zinc-200 dark:border-zinc-800 py-8'>
        <div className='mx-auto max-w-7xl px-4 text-center text-sm text-zinc-500 dark:text-zinc-400'>
          Built with LI.FI API • DeFi UX Challenge
        </div>
      </footer>
    </div>
  )
}
