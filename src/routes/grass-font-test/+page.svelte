<script>
  import GrassFont from "$lib/components/score/GrassFont.svelte";
  import WeedsFont from "$lib/components/score/WeedsFont.svelte";
</script>

<div class="test-page">
  <h1>Grass Font Test</h1>

  <div class="examples">
    <div class="example">
      <h2>Default Size</h2>
      <GrassFont text="HELLO WORLD" />
    </div>

    <div class="example">
      <h2>Large Banner</h2>
      <GrassFont text="RETREEVOR" fontSize={72} />
    </div>

    <div class="example">
      <h2>Small Text</h2>
      <GrassFont text="GRASS LETTERS" fontSize={24} />
    </div>

    <div class="example">
      <h2>Custom Colors</h2>
      <GrassFont
        text="NATURE"
        fontSize={60}
        grassColor="#2d5016"
        grassHighlight="#7cb342"
        grassShadow="#1b2f0a"
      />
    </div>

    <div class="example">
      <h2>Mixed Case</h2>
      <GrassFont text="Hello World" fontSize={48} />
    </div>

    <div class="example">
      <h2>Lowercase</h2>
      <GrassFont text="nature grows" fontSize={36} />
    </div>

    <div class="example">
      <h2>Individual SVG Letters (THE WEEDS Style)</h2>
      <WeedsFont text="THE WEEDS" letterSize={80} />
    </div>

    <div class="example">
      <h2>Small SVG Letters</h2>
      <WeedsFont text="HELLO" letterSize={50} />
    </div>

    <div class="example">
      <h2>Tight Spacing</h2>
      <GrassFont text="COMPACT" fontSize={48} letterSpacing={-2} />
    </div>
  </div>
</div>

<style>
  .test-page {
    padding: 2rem;
    background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
    min-height: 100vh;
  }

  .examples {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .example {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .example h2 {
    margin: 0 0 1rem 0;
    color: #2d5233;
    font-size: 1.2rem;
  }
</style>
