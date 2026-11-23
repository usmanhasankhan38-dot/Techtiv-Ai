/* One stroke family for all three products: 24-grid, 1.6 stroke, round caps. */
const P: Record<string, React.ReactNode> = {
  lock: <path d="M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9h-13z" />,
  spark: <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />,
  arrow: <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" />,
  search: <path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20" />,
  grid: <path d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z" />,
  chart: <path d="M4 19.5h16M7 16v-4M11.5 16V8M16 16v-6.5" />,
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9V16h5v-.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3z" />,
  home: <path d="M4 11 12 4.5l8 6.5M6.5 9.5V19.5h11V9.5" />,
  chat: <path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4 3.5v-3.5h-.5a2 2 0 0 1-2-2z" />,
  cal: <path d="M4.5 6h15v14h-15zM4.5 10.5h15M9 3.5v4M15 3.5v4" />,
  check: <path d="m5.5 12.5 4 4 9-9" />,
  reset: <path d="M4.8 12a7.2 7.2 0 1 0 2.2-5.2M4.5 3.5v4h4" />,
  mic: <path d="M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3zM6 11.5a6 6 0 0 0 12 0M12 17.5v3" />,
  bell: <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5zM10 20.5h4" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />,
}

export function Ic({ n, s = 16 }: { n: keyof typeof P | string; s?: number }) {
  return (
    <svg className="ic" viewBox="0 0 24 24" width={s} height={s} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {P[n]}
    </svg>
  )
}
