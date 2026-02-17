import { NativeSelect } from "@chakra-ui/react"
import { forwardRef } from "react"

export interface NativeSelectRootProps extends NativeSelect.RootProps {}
export interface NativeSelectFieldProps extends Omit<NativeSelect.FieldProps, 'required'> {
  required?: boolean
}

export const NativeSelectRoot = forwardRef<HTMLDivElement, NativeSelectRootProps>(
  function NativeSelectRoot(props, ref) {
    return <NativeSelect.Root ref={ref} {...props} />
  }
)

export const NativeSelectField = forwardRef<HTMLSelectElement, NativeSelectFieldProps>(
  function NativeSelectField(props, ref) {
    return <NativeSelect.Field ref={ref} {...props} />
  }
)
