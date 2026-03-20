import { onClickOutside } from '@vueuse/core'
import type { Directive } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
  const vClickOutside: Directive<HTMLElement, () => void> = {
    mounted(el, binding) {
      onClickOutside(el, binding.value)
    },
    beforeUnmount(el, binding) {
      // Cleanup if needed - onClickOutside automatically cleans up
    }
  }

  nuxtApp.vueApp.directive('click-outside', vClickOutside)
})