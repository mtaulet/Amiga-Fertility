'use client'

import { Box, Flex, VStack, HStack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'
import {
  FiGrid, FiUsers, FiCalendar, FiHome, FiLogOut,
} from 'react-icons/fi'
import { ReactNode } from 'react'
import { Avatar } from '@/components/ui/avatar'

interface AdminSidebarLayoutProps {
  children: ReactNode
}

function NavLink({ href, icon: Icon, label, isActive }: {
  href: string; icon: React.ElementType; label: string; isActive: boolean
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none', width: '100%' }}>
      <Flex
        align="center" px="4" py="3" gap="3" borderRadius="md"
        bg={isActive ? 'whiteAlpha.200' : 'transparent'}
        color="white"
        _hover={{ bg: 'whiteAlpha.300' }}
        cursor="pointer" transition="all 0.2s"
      >
        <Icon size={20} />
        <Text fontWeight={isActive ? 'semibold' : 'medium'}>{label}</Text>
      </Flex>
    </Link>
  )
}

export default function AdminSidebarLayout({ children }: AdminSidebarLayoutProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin/dashboard', icon: FiGrid,     label: 'Dashboard' },
    { href: '/admin/patients',  icon: FiUsers,    label: 'Patients'  },
    { href: '/admin/appointments', icon: FiCalendar, label: 'Appointments' },
    { href: '/admin/clinics',   icon: FiHome,     label: 'Clinics'   },
  ]

  const { user, isLoading } = useUser()

  return (
    <Flex minH="100vh">
      {/* Sidebar */}
      <Box
        position="fixed" left="0" top="0" h="100vh" w="250px"
        bg="bg.sidebar" color="text.inverted"
        display="flex" flexDirection="column"
        zIndex="10"
      >
        {/* Logo + Admin badge */}
        <Box px="6" py="6">
          <Text fontSize="xl" fontWeight="bold" color="white" lineHeight="tight">
            amiga<br />fertility
          </Text>
          <Box
            display="inline-block"
            mt="2"
            px="2"
            py="0.5"
            bg="blackAlpha.300"
            borderRadius="sm"
            fontSize="10px"
            fontWeight="bold"
            letterSpacing="widest"
            color="white"
          >
            ADMIN
          </Box>
        </Box>

        {/* Navigation */}
        <VStack flex="1" align="stretch" px="3" gap="1" overflowY="auto">
          {navItems.map(item => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
            />
          ))}
        </VStack>

        {/* User */}
        {!isLoading && user && (
          <Box borderTop="1px" borderColor="whiteAlpha.300" px="4" py="4">
            <HStack gap="3" mb="3">
              <Avatar size="sm" name={user.name || user.email || 'Admin'} src={user.picture || undefined} />
              <Box flex="1" minW="0">
                <Text fontSize="sm" fontWeight="medium" color="white" lineClamp={1}>
                  {user.name || user.email}
                </Text>
              </Box>
            </HStack>
            <Link href="/auth/logout" style={{ textDecoration: 'none' }}>
              <Flex align="center" gap="2" px="2" py="2" borderRadius="md" color="white"
                _hover={{ bg: 'whiteAlpha.200' }} cursor="pointer" transition="all 0.2s"
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
