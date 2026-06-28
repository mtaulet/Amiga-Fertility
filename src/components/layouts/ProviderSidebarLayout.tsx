'use client'

import { Box, Flex, VStack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiCalendar, FiLogOut, FiUsers, FiHome } from 'react-icons/fi'
import { ReactNode } from 'react'

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

export default function ProviderSidebarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <Flex minH="100vh" bg="cream.50">
      <Box w="240px" bg="brand.600" flexShrink={0} display="flex" flexDirection="column" py="6">
        <Box px="6" mb="8">
          <Text fontSize="xl" fontWeight="bold" color="white" lineHeight="tight">
            amiga<br />fertility
          </Text>
          <Text fontSize="xs" color="whiteAlpha.700" mt="1">Provider Portal</Text>
        </Box>

        <VStack align="stretch" gap="1" px="3" flex="1">
          <NavLink href="/provider/profile" icon={FiHome} label="Clinic Profile" isActive={pathname.startsWith('/provider/profile')} />
          <NavLink href="/provider/patients" icon={FiUsers} label="Patients" isActive={pathname.startsWith('/provider/patients')} />
          <NavLink href="/provider/appointments" icon={FiCalendar} label="Appointments" isActive={pathname.startsWith('/provider/appointments')} />
        </VStack>

        <Box px="3" mt="4">
          <Link href="/auth/logout" style={{ textDecoration: 'none', width: '100%' }}>
            <Flex align="center" px="4" py="3" gap="3" borderRadius="md" color="whiteAlpha.700" _hover={{ bg: 'whiteAlpha.200', color: 'white' }} cursor="pointer">
              <FiLogOut size={18} />
              <Text fontSize="sm">Sign Out</Text>
            </Flex>
          </Link>
        </Box>
      </Box>

      <Box flex="1" overflow="auto">{children}</Box>
    </Flex>
  )
}
