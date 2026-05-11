<script setup>
const props = defineProps({
  caseItem: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["open"]);
</script>

<template>
  <article class="case-card">
    <img :src="props.caseItem.image" :alt="props.caseItem.name" class="case-image" />
    <h3>{{ props.caseItem.name }}</h3>
    <p>Цена: {{ props.caseItem.price }} ₽</p>
    <button :disabled="props.loading" @click="emit('open', props.caseItem.id)">
      {{ props.loading ? "Открываем..." : "Открыть кейс" }}
    </button>
  </article>
</template>
