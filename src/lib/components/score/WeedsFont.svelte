<script lang="ts">
  export let text: string = "HELLO";
  export let letterSize: number = 100;
  export let letterSpacing: number = 10;

  $: letters = text.toUpperCase().split('').filter(char => char.match(/[A-Z]/));
  $: totalWidth = letters.length * letterSize + (letters.length - 1) * letterSpacing;
</script>

<div class="weeds-font" style="width: {totalWidth}px; height: {letterSize * 1.2}px;">
  {#each letters as letter, i}
    <img 
      src="/letters/{letter}.svg" 
      alt="{letter}"
      style="
        width: {letterSize}px; 
        height: {letterSize * 1.2}px;
        position: absolute;
        left: {i * (letterSize + letterSpacing)}px;
        top: 0;
      "
    />
  {/each}
</div>

<style>
  .weeds-font {
    position: relative;
    display: inline-block;
  }
</style>
