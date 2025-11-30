# Circle

An interactive visualization demonstrating the relationship between trigonometric functions and their derivatives/integrals through parametric equations on the unit circle.

## What It Does

The animation traces a point around the unit circle using eight different parametric function pairs:

1. `[sin x, d/dx(sin x)]` = `[sin x, cos x]`
2. `[sin x, integral of sin x]` = `[sin x, -cos x]`
3. `[cos x, d/dx(cos x)]` = `[cos x, -sin x]`
4. `[cos x, integral of cos x]` = `[cos x, sin x]`
5. `[-sin x, d/dx(-sin x)]` = `[-sin x, -cos x]`
6. `[-sin x, integral of -sin x]` = `[-sin x, cos x]`
7. `[-cos x, d/dx(-cos x)]` = `[-cos x, sin x]`
8. `[-cos x, integral of -cos x]` = `[-cos x, -sin x]`

Each pair demonstrates how a trigonometric function and its derivative (or integral) together trace the unit circle as the parameter sweeps from -pi to pi.

### Visual Elements

- A point traces the parametric curve on the unit circle
- Projection lines show the x and y components
- Sine waves emanate from the edges of a bounding square, showing the history of the point's projections
- Crossing points are marked where the functions equal -1, 0, or 1

### Audio

Optional audio plays the circle of fifths as arpeggiated bell tones, with each function cycle advancing through a different key. Ascending arpeggios accompany derivative functions; descending arpeggios accompany integrals. A sustained pad chord provides harmonic context.

## Files

- `index.html` - Local development version (loads circle.js from same directory)
- `index-prod.html` - Production version (loads circle.js from jsDelivr CDN)
- `circle.js` - All animation, rendering, and audio logic
- `circle.html` - Original standalone version with embedded JavaScript

## Usage

### Local Testing

Open `index.html` in a browser. You may need to serve it from a local HTTP server if MathJax has CORS issues:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/index.html`

### Embedding in a Web Page

Copy the contents of `index-prod.html` into your page. The JavaScript loads from jsDelivr CDN to avoid issues with content management systems that encode special characters in inline scripts.

## Dependencies

- MathJax 3 (loaded from CDN) for rendering mathematical notation
- Web Audio API for sound generation (built into modern browsers)

## License

Don't claim you wrote it, I did
