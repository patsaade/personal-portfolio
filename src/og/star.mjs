// Shared pixel-star geometry. Pure + deterministic, so the favicon, social-card
// lockup, and the on-page <PixelStar> component all rasterize the identical star.
// No DOM, no fonts, no I/O — safe to import from build scripts and Astro frontmatter.

export const STAR_GRID = 13; // raster resolution (chunky, legible down to ~16px)

// (col,row) cells of a grid×grid raster whose centers fall inside a point-up
// 5-point star. Deterministic, so the icon is byte-identical everywhere.
export function starCells(grid = STAR_GRID) {
  const c = (grid - 1) / 2;
  const R = c; // outer radius reaches the grid edge
  const ri = R * 0.42; // inner radius (point sharpness)
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? R : ri;
    pts.push([c + rad * Math.cos(a), c + rad * Math.sin(a)]);
  }
  const inside = (px, py) => {
    let hit = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };
  const cells = [];
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (inside(x + 0.5, y + 0.5)) cells.push([x, y]);
    }
  }
  return cells;
}
