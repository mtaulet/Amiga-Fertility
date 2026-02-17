"use client"

import { Box, Flex, VStack, HStack, Text } from "@chakra-ui/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0/client"
import { FiHome, FiUser, FiCalendar, FiMapPin, FiLogOut } from "react-icons/fi"
import { ReactNode } from "react"
import { Avatar } from "@/components/ui/avatar"

interface SidebarLayoutProps {
  children: ReactNode
}

interface NavLinkProps {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
}

function NavLink({ href, icon: Icon, label, isActive }: NavLinkProps) {
  return (
    <Link href={href} style={{ textDecoration: 'none', width: '100%' }}>
      <Flex
        align="center"
        px="4"
        py="3"
        gap="3"
        borderRadius="md"
        bg={isActive ? "whiteAlpha.200" : "transparent"}
        color="white"
        _hover={{ bg: "whiteAlpha.300" }}
        cursor="pointer"
        transition="all 0.2s"
      >
        <Icon size={20} />
        <Text fontWeight={isActive ? "semibold" : "medium"}>{label}</Text>
      </Flex>
    </Link>
  )
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname()
  const { user, isLoading } = useUser()

  const navItems = [
    { href: "/dashboard", icon: FiHome, label: "Dashboard" },
    { href: "/profile", icon: FiUser, label: "Profile" },
    { href: "/clinics", icon: FiMapPin, label: "Clinics" },
    { href: "/appointments", icon: FiCalendar, label: "Appointments" },
  ]

  return (
    <Flex minH="100vh">
      {/* Sidebar */}
      <Box
        position="fixed"
        left="0"
        top="0"
        h="100vh"
        w="250px"
        bg="bg.sidebar"
        color="text.inverted"
        display="flex"
        flexDirection="column"
      >
        {/* Logo */}
        <Box px="6" py="6">
          <Text fontSize="2xl" fontWeight="bold" color="white">
            amiga fertility
          </Text>
        </Box>

        {/* Navigation Links */}
        <VStack flex="1" align="stretch" px="3" gap="1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href}
            />
          ))}
        </VStack>

        {/* User Profile Section */}
        {!isLoading && user && (
          <Box borderTop="1px" borderColor="whiteAlpha.300" px="4" py="4">
            <HStack gap="3" mb="3">
              <Avatar
                size="sm"
                name={user.name || user.email || "User"}
                src={user.picture || undefined}
              />
              <Box flex="1" minW="0">
                <Text fontSize="sm" fontWeight="medium" color="white" lineClamp={1}>
                  {user.name || user.email}
                </Text>
              </Box>
            </HStack>
            <Link href="/api/auth/logout" style={{ textDecoration: 'none' }}>
              <Flex
                align="center"
                gap="2"
                px="2"
                py="2"
                borderRadius="md"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
                cursor="pointer"
                transition="all 0.2s"
              >
                <FiLogOut size={16} />
                <Text fontSize="sm">Sign Out</Text>
              </Flex>
            </Link>
          </Box>
        )}
      </Box>

      {/* Main Content */}
      <Box ml="250px" flex="1" bg="bg.canvas" minH="100vh">
        {children}
      </Box>
    </Flex>
  )
}
