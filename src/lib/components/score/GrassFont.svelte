<script lang="ts">
  export let text: string = "HELLO";
  export let fontSize: number = 48;
  export let letterSpacing: number = 4;
  export let grassColor: string = "#4a7c59";
  export let grassHighlight: string = "#6b9b7a";
  export let grassShadow: string = "#2d5233";

  // SVG path data for all letters (simplified but readable shapes)
  const letterPaths: Record<string, string> = {
    // Uppercase letters
    A: "M20 100 L50 20 L80 100 M30 70 L70 70",
    B: "M20 20 L20 100 L60 100 Q80 100 80 80 Q80 60 60 60 L20 60 M20 20 L60 20 Q80 20 80 40 Q80 60 60 60",
    C: "M80 30 Q70 20 50 20 Q30 20 20 40 L20 80 Q20 100 40 100 Q60 100 70 90",
    D: "M20 20 L20 100 L50 100 Q80 100 80 60 L80 40 Q80 20 50 20 Z",
    E: "M20 20 L20 100 L80 100 M20 60 L70 60 M20 20 L80 20",
    F: "M20 20 L20 100 M20 60 L70 60 M20 20 L80 20",
    G: "M80 30 Q70 20 50 20 Q30 20 20 40 L20 80 Q20 100 40 100 L60 100 L60 70 L50 70",
    H: "M20 20 L20 100 M80 20 L80 100 M20 60 L80 60",
    I: "M30 20 L70 20 M50 20 L50 100 M30 100 L70 100",
    J: "M30 20 L70 20 M60 20 L60 80 Q60 100 40 100 Q20 100 20 80",
    K: "M20 20 L20 100 M80 20 L20 60 L80 100",
    L: "M20 20 L20 100 L80 100",
    M: "M20 100 L20 20 L50 60 L80 20 L80 100",
    N: "M20 100 L20 20 L80 100 L80 20",
    O: "M50 20 Q30 20 20 40 L20 80 Q20 100 50 100 Q80 100 80 80 L80 40 Q80 20 50 20 Z",
    P: "M20 20 L20 100 M20 20 L60 20 Q80 20 80 40 Q80 60 60 60 L20 60",
    Q: "M50 20 Q30 20 20 40 L20 80 Q20 100 50 100 Q80 100 80 80 L80 40 Q80 20 50 20 M70 80 L85 95",
    R: "M20 20 L20 100 M20 20 L60 20 Q80 20 80 40 Q80 60 60 60 L20 60 M60 60 L80 100",
    S: "M80 30 Q70 20 50 20 Q30 20 20 30 Q20 40 30 50 L70 60 Q80 70 80 80 Q80 100 60 100 Q40 100 30 90",
    T: "M20 20 L80 20 M50 20 L50 100",
    U: "M20 20 L20 80 Q20 100 50 100 Q80 100 80 80 L80 20",
    V: "M20 20 L50 100 L80 20",
    W: "M20 20 L30 100 L50 60 L70 100 L80 20",
    X: "M20 20 L80 100 M80 20 L20 100",
    Y: "M20 20 L50 60 L80 20 M50 60 L50 100",
    Z: "M20 20 L80 20 L20 100 L80 100",

    // Lowercase letters (positioned in lower portion of 100-unit space)
    a: "M70 50 Q80 40 80 50 L80 100 M80 70 Q70 60 50 60 Q30 60 20 70 Q20 80 30 90 Q50 100 70 90 L80 90",
    b: "M20 20 L20 100 M20 70 Q30 60 50 60 Q70 60 80 70 Q80 90 70 100 Q50 100 20 90",
    c: "M80 70 Q70 60 50 60 Q30 60 20 70 Q20 90 30 100 Q50 100 70 90",
    d: "M80 20 L80 100 M80 70 Q70 60 50 60 Q30 60 20 70 Q20 90 30 100 Q50 100 80 90",
    e: "M20 80 L70 80 Q80 70 70 60 Q50 60 30 60 Q20 60 20 70 Q20 90 30 100 Q50 100 70 90",
    f: "M60 20 Q50 20 40 30 L40 100 M30 70 L60 70",
    g: "M80 60 L80 110 Q80 120 70 120 Q50 120 40 110 M80 70 Q70 60 50 60 Q30 60 20 70 Q20 90 30 100 Q50 100 80 90",
    h: "M20 20 L20 100 M20 70 Q30 60 50 60 Q70 60 80 70 L80 100",
    i: "M50 40 L50 45 M50 60 L50 100 M40 100 L60 100",
    j: "M60 40 L60 45 M60 60 L60 110 Q60 120 50 120 Q40 120 30 110",
    k: "M20 20 L20 100 M70 60 L20 80 L70 100",
    l: "M50 20 L50 100 M40 100 L60 100",
    m: "M20 60 L20 100 M20 70 Q25 60 35 60 Q45 60 50 70 L50 100 M50 70 Q55 60 65 60 Q75 60 80 70 L80 100",
    n: "M20 60 L20 100 M20 70 Q30 60 50 60 Q70 60 80 70 L80 100",
    o: "M50 60 Q30 60 20 70 Q20 90 30 100 Q50 100 70 100 Q80 100 80 90 Q80 70 70 60 Q50 60 30 60",
    p: "M20 60 L20 120 M20 70 Q30 60 50 60 Q70 60 80 70 Q80 90 70 100 Q50 100 20 90",
    q: "M80 60 L80 120 M80 70 Q70 60 50 60 Q30 60 20 70 Q20 90 30 100 Q50 100 80 90",
    r: "M20 60 L20 100 M20 70 Q30 60 50 60 Q60 60 70 70",
    s: "M70 70 Q60 60 50 60 Q30 60 20 70 Q30 80 50 80 Q70 80 80 90 Q70 100 50 100 Q30 100 20 90",
    t: "M40 30 L40 100 Q40 110 50 110 Q60 110 70 100 M30 60 L60 60",
    u: "M20 60 L20 90 Q20 100 30 100 Q50 100 70 100 Q80 100 80 90 L80 60 L80 100",
    v: "M20 60 L50 100 L80 60",
    w: "M20 60 L30 100 L50 80 L70 100 L80 60",
    x: "M20 60 L80 100 M80 60 L20 100",
    y: "M20 60 L50 100 L80 60 M50 100 L50 120 Q50 130 40 130 Q30 130 20 120",
    z: "M20 60 L80 60 L20 100 L80 100",

    " ": "", // Space character
  };

  // Generate grass texture pattern paths
  function generateGrassPattern(): string {
    const grassBlades = [];
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 100;
      const height = 3 + Math.random() * 8;
      const curve = Math.random() * 2 - 1;
      grassBlades.push(
        `M${x} 10 Q${x + curve} ${10 - height / 2} ${x + curve * 0.5} ${10 - height}`,
      );
    }
    return grassBlades.join(" ");
  }

  $: letters = text.toUpperCase().split("");
  $: totalWidth = letters.length * (fontSize + letterSpacing) - letterSpacing;
</script>

<div
  class="grass-font"
  style="width: {totalWidth}px; height: {fontSize * 1.2}px;"
>
  <svg width="100%" height="100%" viewBox="0 0 {totalWidth} {fontSize * 1.2}">
    <defs>
      <!-- Grass texture pattern -->
      <pattern
        id="grassPattern"
        patternUnits="userSpaceOnUse"
        width="20"
        height="12"
      >
        <rect width="20" height="12" fill={grassColor} />
        <path
          d={generateGrassPattern()}
          stroke={grassHighlight}
          stroke-width="0.5"
          fill="none"
        />
        <path
          d={generateGrassPattern()}
          stroke={grassShadow}
          stroke-width="0.3"
          fill="none"
          opacity="0.6"
        />
      </pattern>

      <!-- Letter shadow filter -->
      <filter id="letterShadow">
        <feDropShadow
          dx="2"
          dy="2"
          stdDeviation="1"
          flood-color={grassShadow}
          flood-opacity="0.5"
        />
      </filter>
    </defs>

    {#each letters as letter, i}
      {#if letterPaths[letter]}
        <g transform="translate({i * (fontSize + letterSpacing)}, 0)">
          <!-- Letter shape filled with grass pattern -->
          <path
            d={letterPaths[letter]}
            fill="url(#grassPattern)"
            stroke={grassShadow}
            stroke-width="1"
            filter="url(#letterShadow)"
            transform="scale({fontSize / 100})"
          />
        </g>
      {/if}
    {/each}
  </svg>
</div>

<style>
  .grass-font {
    display: inline-block;
    font-family: monospace;
  }
</style>
