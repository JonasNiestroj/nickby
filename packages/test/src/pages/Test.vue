<template>
  <h1>Hello, world!</h1>

  <p>
    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Pariatur excepturi
    labore tempore expedita, et iste tenetur suscipit explicabo! Dolores,
    aperiam non officia eos quod asperiores
  </p>
  {{ ssrData.data.name }}
  {{ name }}
  <button @click="onClick">Click</button>
</template>

<script setup>
import { ref } from 'vue';
import useData from 'nickby/composables/data.js';

const ssrData = useData();

const name = ref('');

const onClick = () => {
  ssrData.value.data.name = 'Jonas';
};
</script>
