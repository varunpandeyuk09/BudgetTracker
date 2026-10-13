const paths = {
  home: <path d="M3.5 10.6 12 3.8l8.5 6.8V20a1 1 0 0 1-1 1h-4.6v-5.6H9.1V21H4.5a1 1 0 0 1-1-1z" />,
  stats: (
    <>
      <path d="M4 20V11" />
      <path d="M9.3 20V5" />
      <path d="M14.7 20v-6.5" />
      <path d="M20 20V8.5" />
    </>
  ),
  list: (
    <>
      <path d="M6.5 3.5h11v17l-2.2-1.5-2.2 1.5-2.1-1.5-2.2 1.5-2.3-1.5z" />
      <path d="M9.5 8.5h5" />
      <path d="M9.5 12.5h5" />
    </>
  ),
  gear: (
    <>
      <path d="M4 7.5h7" />
      <path d="M15.5 7.5H20" />
      <path d="M4 16.5h4.5" />
      <path d="M13 16.5H20" />
      <circle cx="13" cy="7.5" r="2.4" />
      <circle cx="10.5" cy="16.5" r="2.4" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </>
  ),
  close: (
    <>
      <path d="M6.5 6.5l11 11" />
      <path d="M17.5 6.5l-11 11" />
    </>
  ),
  left: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  right: <path d="M9.5 5.5 16 12l-6.5 6.5" />,
  down: <path d="M5.5 9.5 12 16l6.5-6.5" />,
}

export default function Icon({ name, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
