import { useEffect, RefObject } from 'react'

/**
 * Hook that detects clicks outside of a specified element
 *
 * EXPLANATION: This hook is like having a security guard for our expandable card.
 * It watches for mouse clicks anywhere on the page, and if someone clicks
 * outside our card, it automatically closes the card. This creates an intuitive
 * user experience that people expect from modal/popup interfaces.
 *
 * @param ref - Reference to the element we want to monitor
 * @param handler - Function to call when clicking outside (usually closes the modal)
 */
export function useOutsideClick(ref: RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      // EXPLANATION: Check if the clicked element exists and if our ref exists
      if (!event.target || !ref.current) return

      // EXPLANATION: Check if the clicked element is outside our component
      // contains() returns true if the clicked element is inside our component
      if (!ref.current.contains(event.target as Node)) {
        // EXPLANATION: If the click was outside, call the handler function
        // This is usually a function that closes the modal/card
        handler()
      }
    }

    // EXPLANATION: Start listening for mouse clicks anywhere on the page
    document.addEventListener('mousedown', handleClick)

    // EXPLANATION: Cleanup function - stop listening when component unmounts
    // This prevents memory leaks and ensures we don't have ghost event listeners
    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [ref, handler]) // EXPLANATION: Re-run this effect if ref or handler changes
}