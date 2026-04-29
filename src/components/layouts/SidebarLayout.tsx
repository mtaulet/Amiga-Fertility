"use client"

import { Box, Flex, VStack, HStack, Text } from "@chakra-ui/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0/client"
import { FiHome, FiUser, FiCalendar, FiMapPin, FiLogOut, FiSettings } from "react-icons/fi"
import { ReactNode } from "react"
import { Avatar } from "@/components/ui/avatar"

interface SidebarLayoutProps {
  children: ReactNode
}

function NavLink({ href, icon: Icon, label, isActive }: {
  href: string; icon: React.ElementType; label: string; isActive: boolean
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none', width: '100%' }}>
      <Flex
        align="center" px="4" py="3" gap="3" borderRadius="md"
        bg={isActive ? "whiteAlpha.200" : "transparent"}
        color="white"
        _hover={{ bg: "whiteAlpha.300" }}
        cursor="pointer" transition="all 0.2s"
      >
        <Icon size={20} />
        <Text fontWeight={isActive ? "semibold" : "medium"}>{label}</Text>
      </Flex>
    </Link>
  )
}

function SubNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', width: '100%' }}>
      <Flex
        align="center" pl="10" pr="4" py="2" gap="2"
        color="whiteAlpha.800"
        _hover={{ color: "white" }}
        cursor="pointer" transition="color 0.15s"
        borderLeft="2px solid" borderColor="whiteAlpha.300"
        ml="6"
      >
        <FiSettings size={14} />
        <Text fontSize="sm" fontWeight="medium">{label}</Text>
      </Flex>
    </Link>
  )
}

const appointmentSubNav = [
  { href: "#first-appointment", label: "First appointment" },
  { href: "#communications", label: "Communications" },
  { href: "#summary", label: "Summary" },
]

const treatmentSubNav = [
  { href: "/treatment", label: "Calendar" },
]

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname()
  const { user, isLoading } = useUser()
  const onAppointments = pathname === '/appointments'
  const onTreatment = pathname.startsWith('/treatment')

  const navItems = [
    { href: "/dashboard", icon: FiHome, label: "Dashboard" },
    { href: "/profile", icon: FiUser, label: "Patient" },
    { href: "/clinics/select", icon: FiMapPin, label: "Clinic Selection" },
    { href: "/appointments", icon: FiCalendar, label: onAppointments ? "Appointments >" : "Appointments" },
    { href: "/treatment", icon: FiCalendar, label: onTreatment ? "Treatment >" : "Treatment" },
  ]

  return (
    <Flex minH="100vh">
      {/* Sidebar */}
      <Box
        position="fixed" left="0" top="0" h="100vh" w="250px"
        bg="bg.sidebar" color="text.inverted"
        display="flex" flexDirection="column"
        zIndex="10"
      >
        {/* Logo */}
        <Box px="6" py="6">
          <Text fontSize="xl" fontWeight="bold" color="white" lineHeight="tight">
            amiga<br />fertility
          </Text>
        </Box>

        {/* Navigation */}
        <VStack flex="1" align="stretch" px="3" gap="1" overflowY="auto">
          {navItems.map((item) => (
            <Box key={item.href}>
              <NavLink
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
              />
              {/* Appointment sub-navigation */}
              {item.href === '/appointments' && onAppointments && (
                <VStack align="stretch" gap="0" mt="1" mb="1">
                  {appointmentSubNav.map(sub => (
                    <SubNavLink key={sub.href} href={sub.href} label={sub.label} />
                  ))}
                </VStack>
              )}
              {item.href === '/treatment' && onTreatment && (
                <VStack align="stretch" gap="0" mt="1" mb="1">
                  {treatmentSubNav.map(sub => (
                    <SubNavLink key={sub.href} href={sub.href} label={sub.label} />
                  ))}
                </VStack>
              )}
            </Box>
          ))}
        </VStack>

        {/* User */}
        {!isLoading && user && (
          <Box borderTop="1px" borderColor="whiteAlpha.300" px="4" py="4">
            <HStack gap="3" mb="3">
              <Avatar size="sm" name={user.name || user.email || "User"} src={user.picture || undefined} />
              <Box flex="1" minW="0">
                <Text fontSize="sm" fontWeight="medium" color="white" lineClamp={1}>
                  {user.name || user.email}
                </Text>
              </Box>
            </HStack>
            <Link href="/auth/logout" style={{ textDecoration: 'none' }}>
              <Flex align="center" gap="2" px="2" py="2" borderRadius="md" color="white"
                _hover={{ bg: "whiteAlpha.200" }} cursor="pointer" transition="all 0.2s"
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
