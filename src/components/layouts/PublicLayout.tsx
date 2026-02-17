import { Box } from "@chakra-ui/react"
import { ReactNode } from "react"

interface PublicLayoutProps {
  children: ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <Box bg="bg.canvas" minH="100vh">
      {children}
    </Box>
  )
}
