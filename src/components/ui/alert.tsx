import { Alert as ChakraAlert, Flex } from "@chakra-ui/react"
import { forwardRef } from "react"

export interface AlertRootProps extends ChakraAlert.RootProps {}
export interface AlertTitleProps extends ChakraAlert.TitleProps {}
export interface AlertDescriptionProps extends ChakraAlert.DescriptionProps {}

export const AlertRoot = forwardRef<HTMLDivElement, AlertRootProps>(
  function AlertRoot(props, ref) {
    return (
      <ChakraAlert.Root ref={ref} {...props}>
        <Flex gap="3" width="full">
          <ChakraAlert.Indicator />
          {props.children}
        </Flex>
      </ChakraAlert.Root>
    )
  }
)

export const AlertTitle = forwardRef<HTMLDivElement, AlertTitleProps>(
  function AlertTitle(props, ref) {
    return <ChakraAlert.Title ref={ref} {...props} />
  }
)

export const AlertDescription = forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  function AlertDescription(props, ref) {
    return <ChakraAlert.Description ref={ref} {...props} />
  }
)

export const Alert = {
  Root: AlertRoot,
  Title: AlertTitle,
  Description: AlertDescription,
}
