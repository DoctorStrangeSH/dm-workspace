/* eslint-disable @next/next/no-img-element -- Native image events are required in this offline fixture. */
import type { ImgHTMLAttributes } from 'react'
// Preserve native image load/error semantics; Next's server optimization is outside this offline UI fixture.
export default function Image({
  fill,
  unoptimized,
  preload,
  priority,
  sizes,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean
  unoptimized?: boolean
  preload?: boolean
  priority?: boolean
}) {
  void unoptimized
  void preload
  void priority
  void sizes
  return (
    <img
      {...props}
      alt={props.alt ?? ''}
      style={{
        ...props.style,
        ...(fill ? { position: 'absolute', width: '100%', height: '100%', inset: 0 } : {}),
      }}
    />
  )
}
