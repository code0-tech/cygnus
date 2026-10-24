import type { Appearance } from "@stripe/stripe-js"

// Bump when the appearance changes: Stripe's checkout elements only read it on mount, so the version is part of their key.
export const STRIPE_APPEARANCE_VERSION = "pictor-10"

const SURFACE = "#191825"
const SURFACE_RAISED = "#201e2c"
const SURFACE_SELECTED = "#302e3b"
const HOVER_OVERLAY = "rgba(191, 191, 191, 0.15)"
const INSET_HIGHLIGHT = "inset 0 1px 1px rgba(255, 255, 255, 0.1)"
const INSET_HIGHLIGHT_STRONG = "inset 0 1px 1px rgba(255, 255, 255, 0.12)"
const INSET_SUBTLE = "inset 0 1px 1px rgba(191, 191, 191, 0.1)"

// Picker items keep Stripe's focus ring and border off in every state.
const pickerItemReset = { border: "none", boxShadow: INSET_SUBTLE, outline: "none" }
const pickerItem = { backgroundColor: SURFACE, ...pickerItemReset }
const pickerItemStrict = { ...pickerItem, borderColor: "transparent", borderWidth: "0px", outlineOffset: "0px" }
const tabSelected = { backgroundColor: SURFACE_SELECTED, border: "none", boxShadow: INSET_HIGHLIGHT_STRONG, color: "#ffffff" }

export const stripeAppearance = {
    theme: "night",
    labels: "above",
    variables: {
        colorPrimary: "#72f896",
        colorBackground: SURFACE_RAISED,
        colorText: "#ffffff",
        colorTextSecondary: "rgba(255, 255, 255, 0.5)",
        colorTextPlaceholder: "rgba(255, 255, 255, 0.35)",
        colorDanger: "#ef5b68",
        tabIconColor: "rgba(255, 255, 255, 0.7)",
        tabIconHoverColor: "#ffffff",
        tabIconSelectedColor: "#ffffff",
        tabIconMoreColor: "rgba(255, 255, 255, 0.7)",
        tabIconMoreHoverColor: "#ffffff",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSizeBase: "13px",
        fontWeightNormal: "400",
        fontWeightMedium: "400",
        spacingUnit: "4px",
        gridRowSpacing: "16px",
        borderRadius: "16px",
        focusBoxShadow: "none",
        focusOutline: "none",
        inputBoxShadow: INSET_HIGHLIGHT,
        inputFocusBoxShadow: "none",
        inputFocusColorBorder: "transparent",
        labelColorText: "rgba(255, 255, 255, 0.5)",
        labelFontSize: "11px",
        labelFontWeight: "400",
        labelSpacing: "7px",
    },
    rules: {
        ".Input": { backgroundColor: "#272532", border: "none", boxShadow: INSET_HIGHLIGHT, padding: "11px", letterSpacing: "-0.5px" },
        ".Input:hover": { backgroundColor: HOVER_OVERLAY },
        ".Input:focus": { backgroundColor: HOVER_OVERLAY, border: "none", boxShadow: "none", outline: "none" },
        ".Input--invalid": { backgroundColor: "#1c0516", border: "none", boxShadow: "inset 0 1px 1px rgba(217, 4, 41, 0.1)" },
        ".Dropdown": { backgroundColor: SURFACE, border: "none", borderRadius: "16px", boxShadow: `${INSET_HIGHLIGHT}, 0 12px 32px rgba(0, 0, 0, 0.35)` },
        ".DropdownItem": { backgroundColor: SURFACE, borderRadius: "10px", color: "rgba(255, 255, 255, 0.75)", fontSize: "13px", margin: "4px", padding: "10px 12px" },
        ".DropdownItem.DropdownItem--highlight": { backgroundColor: SURFACE_RAISED, color: "#ffffff", borderLeftWidth: "0px", borderLeftColor: "transparent", paddingLeft: "12px" },
        ".DropdownItem:active": { backgroundColor: SURFACE_SELECTED, color: "#ffffff" },
        ".DropdownItem:focus": { backgroundColor: SURFACE_RAISED, color: "#ffffff", outline: "none" },
        ".Label": { color: "rgba(255, 255, 255, 0.5)", fontSize: "11px", fontWeight: "400", letterSpacing: "-0.5px", textTransform: "uppercase" },
        ".Block": pickerItem,
        ".PickerItem": pickerItem,
        ".PickerItem--selected": pickerItem,
        ".PickerItem:focus": pickerItemReset,
        ".PickerItem:hover": pickerItemReset,
        ".PickerItem--highlight": pickerItemReset,
        ".PickerItem:active": pickerItemReset,
        ".PickerItem--selected:hover": pickerItemStrict,
        ".PickerItem--selected:focus": pickerItem,
        ".PickerItem--selected:active": pickerItem,
        ".PickerItem--highlight:hover": pickerItemStrict,
        ".PickerItem--highlight:focus": pickerItemStrict,
        ".PickerItem--highlight:active": pickerItemStrict,
        ".Tab": { backgroundColor: SURFACE, border: "none", boxShadow: INSET_HIGHLIGHT, color: "rgba(255, 255, 255, 0.7)", padding: "12px 14px" },
        ".Tab:hover": { backgroundColor: SURFACE_RAISED, color: "#ffffff" },
        ".Tab--selected": tabSelected,
        ".Tab--selected:hover": tabSelected,
        ".Tab:focus": { backgroundColor: SURFACE_SELECTED, boxShadow: INSET_HIGHLIGHT_STRONG, outline: "none" },
        ".AccordionItem": { backgroundColor: SURFACE, border: "none", boxShadow: INSET_HIGHLIGHT },
        ".AccordionItem:hover": { backgroundColor: SURFACE_RAISED },
        ".AccordionItem--selected": { backgroundColor: SURFACE_RAISED, border: "none", boxShadow: "none" },
        ".AccordionItem:focus-visible": { backgroundColor: "#2b2938", boxShadow: "none", outline: "none" },
    },
} satisfies Appearance
