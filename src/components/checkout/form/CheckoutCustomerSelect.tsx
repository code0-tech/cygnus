"use client"

import type { CheckoutData } from "@/lib/cms"
import type { CheckoutCustomerData } from "@/lib/checkout/client"
import { SelectContent, SelectInput, SelectItem, SelectItemText, SelectPortal, SelectTrigger, SelectValue, SelectViewport } from "@code0-tech/pictor"
import { IconChevronDown, IconPlus } from "@tabler/icons-react"

const NEW_CUSTOMER_VALUE = "new"

interface CheckoutCustomerSelectProps {
    content: CheckoutData["form"]
    customers: CheckoutCustomerData[]
    onValueChange: (customerId: string | null) => void
    selectedCustomer: CheckoutCustomerData | undefined
}

export function CheckoutCustomerSelect({ content, customers, onValueChange, selectedCustomer }: CheckoutCustomerSelectProps) {
    return (
        <div className="[&_.input__label]:leading-none [&_.input-wrapper]:mt-1">
            <SelectInput title={content.customerSelectLabel} value={selectedCustomer?.id ?? NEW_CUSTOMER_VALUE} onValueChange={(value) => onValueChange(value === NEW_CUSTOMER_VALUE ? null : value)}>
                <SelectTrigger className="flex h-9! w-full! items-center gap-2 text-left! text-sm! outline-none! ring-0! focus:outline-none! focus:ring-0! focus-visible:outline-none! focus-visible:ring-0!">
                    <SelectValue>{selectedCustomer?.name || selectedCustomer?.email || content.newCustomerLabel}</SelectValue>
                    <IconChevronDown aria-hidden="true" className="ml-auto mr-2 shrink-0" size={16} />
                </SelectTrigger>
                <SelectPortal>
                    <SelectContent position="popper" className="z-100 w-(--radix-select-trigger-width)!">
                        <SelectViewport>
                            {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                    <SelectItemText>{customer.name || customer.email || content.newCustomerLabel}</SelectItemText>
                                </SelectItem>
                            ))}
                            <SelectItem value={NEW_CUSTOMER_VALUE}>
                                <SelectItemText>
                                    <span className="flex items-center gap-2 text-brand">
                                        <IconPlus aria-hidden="true" size={15} />
                                        {content.newCustomerLabel}
                                    </span>
                                </SelectItemText>
                            </SelectItem>
                        </SelectViewport>
                    </SelectContent>
                </SelectPortal>
            </SelectInput>
        </div>
    )
}
