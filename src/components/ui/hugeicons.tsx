import * as React from "react"

type IconNode = [string, Record<string, any>]
type IconType = IconNode[]

type HugeiconsIconProps = Omit<React.SVGProps<SVGSVGElement>, "color"> & {
  icon: IconType
  altIcon?: IconType
  showAlt?: boolean
  size?: number
  color?: string
  primaryColor?: string
  secondaryColor?: string
  disableSecondaryOpacity?: boolean
  strokeWidth?: number
}

function resolveColor({
  primaryColor,
  secondaryColor,
  isSecondary,
  disableSecondaryOpacity,
}: {
  primaryColor?: string
  secondaryColor?: string
  isSecondary?: boolean
  disableSecondaryOpacity?: boolean
}) {
  if (!primaryColor && !secondaryColor) return undefined
  if (isSecondary && secondaryColor) return secondaryColor
  if (primaryColor) return primaryColor
  return undefined
}

const HugeiconsIcon = React.forwardRef<SVGSVGElement, HugeiconsIconProps>(
  (
    {
      icon,
      altIcon,
      showAlt,
      size = 24,
      color = "currentColor",
      primaryColor,
      secondaryColor,
      disableSecondaryOpacity,
      strokeWidth,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const nodes = showAlt && altIcon ? altIcon : icon

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        style={{ color, ...style }}
        {...props}
      >
        {nodes.map(([tag, attrs], index) => {
          const resolvedColor = resolveColor({
            primaryColor,
            secondaryColor,
            isSecondary: typeof attrs["data-secondary"] === "string",
            disableSecondaryOpacity,
          })
          const finalAttrs = {
            ...attrs,
            strokeWidth:
              typeof strokeWidth === "number" ? strokeWidth : attrs.strokeWidth,
            stroke:
              resolvedColor && attrs.stroke === "currentColor"
                ? resolvedColor
                : attrs.stroke,
            fill:
              resolvedColor && attrs.fill === "currentColor"
                ? resolvedColor
                : attrs.fill,
          }

          if (disableSecondaryOpacity && finalAttrs.fillOpacity) {
            finalAttrs.fillOpacity = 1
          }
          if (disableSecondaryOpacity && finalAttrs.strokeOpacity) {
            finalAttrs.strokeOpacity = 1
          }

          return React.createElement(tag, { ...finalAttrs, key: index })
        })}
      </svg>
    )
  }
)

HugeiconsIcon.displayName = "HugeiconsIcon"

export { HugeiconsIcon }
