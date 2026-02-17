import { Avatar as ChakraAvatar } from "@chakra-ui/react"
import { forwardRef } from "react"

export interface AvatarProps extends ChakraAvatar.RootProps {
  name?: string
  src?: string
  icon?: React.ReactNode
  fallback?: React.ReactNode
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  function Avatar(props, ref) {
    const { name, src, icon, fallback, children, ...rootProps } = props
    return (
      <ChakraAvatar.Root ref={ref} {...rootProps}>
        <ChakraAvatar.Fallback>
          {icon || fallback || name}
        </ChakraAvatar.Fallback>
        {src && <ChakraAvatar.Image src={src} alt={name} />}
        {children}
      </ChakraAvatar.Root>
    )
  }
)
