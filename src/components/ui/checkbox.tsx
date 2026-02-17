import { Checkbox as ChakraCheckbox } from "@chakra-ui/react"
import { forwardRef } from "react"

export interface CheckboxProps extends ChakraCheckbox.RootProps {
  icon?: React.ReactNode
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
  rootRef?: React.Ref<HTMLLabelElement>
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(props, ref) {
    const { icon, children, inputProps, rootRef, ...rootProps } = props
    return (
      <ChakraCheckbox.Root ref={rootRef} {...rootProps}>
        <ChakraCheckbox.HiddenInput ref={ref} {...inputProps} />
        <ChakraCheckbox.Control>
          {icon || <ChakraCheckbox.Indicator />}
        </ChakraCheckbox.Control>
        {children != null && (
          <ChakraCheckbox.Label>{children}</ChakraCheckbox.Label>
        )}
      </ChakraCheckbox.Root>
    )
  }
)
