<template>
  <button 
    :class="['btn', `btn-${variant}`]" 
    @click="onClick"
  >
    <slot>Button</slot>
  </button>
</template>

<script>
export default {
  name: 'MyButton',
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: value => ['primary', 'secondary', 'outline'].includes(value)
    }
  },
  methods: {
    onClick(event) {
      // Debug log for click event
      console.debug('Button clicked', { variant: this.variant });
      this.$emit('click', event);
    }
  },
  mounted() {
    // Debug log for component mount
    console.debug('Button component mounted', { variant: this.variant });
  }
};
</script>

<style scoped>
.btn {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.25s, background-color 0.25s;
}

.btn-primary {
  background-color: #1a1a1a;
  color: white;
}

.btn-secondary {
  background-color: #4c56c0;
  color: white;
}

.btn-outline {
  background-color: transparent;
  color: #1a1a1a;
  border: 1px solid #1a1a1a;
}

.btn:hover {
  border-color: #646cff;
}

.btn:focus,
.btn:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}
</style>
