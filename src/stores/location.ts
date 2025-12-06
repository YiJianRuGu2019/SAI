import { defineStore } from 'pinia';
import { ref } from 'vue';

// Define the type for a location object
type Location = { name: string; address: string; coords: any };
type LastSelection = Location & { id: number };

export const useLocationStore = defineStore('location', () => {
  const locationTags = ref<Location[]>([]);
  // State to hold the most recently selected location, with a unique ID to ensure reactivity
  const lastSelection = ref<LastSelection | null>(null);

  function addLocationTag(location: Location) {
    // Add to the list of tags if it's not a duplicate
    const exists = locationTags.value.some(tag => tag.name === location.name);
    if (!exists) {
      locationTags.value.push(location);
    }
    // Always update the last selection with a new object to trigger watchers
    lastSelection.value = { ...location, id: Date.now() };
    console.log('全局状态: 更新了最后选择的位置', lastSelection.value);
  }

  function removeLocationTag(index: number) {
    locationTags.value.splice(index, 1);
  }

  return {
    locationTags,
    lastSelection,
    addLocationTag,
    removeLocationTag
  };
});