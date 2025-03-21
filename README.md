# ShapeRunner

A fast-paced platformer game with a Tron-like aesthetic, built using Three.js.

## Features

- **Neon Visual Style**: A visually striking game with glowing elements and a futuristic look
- **Tile-Based Level System**: Levels are built using ASCII characters in JSON files
- **Collectibles**: Coins, keys, and other items to enhance gameplay
- **Special Tiles**: Jump pads, slopes, and more interactive elements
- **Dynamic Level Generation**: Levels are created by combining different level "titles" (sections)
- **Color Schemes**: Different color palettes for visual variety

## Controls

- **Space/Up Arrow**: Jump
- **P or Pause Button**: Pause game

## Tile System

The game uses a tile-based level system with the following ASCII characters:

| Character | Description |
|-----------|-------------|
| `B` | Solid Block/Platform |
| `^` | Spike (hazard) |
| `/` | Slope (upward) |
| `J` | Jump Pad |
| `C` | Coin (collectible) |
| `P` | Portal |
| `K` | Key (collectible) |
| `O` | Saw Blade (hazard) |
| `S` | Start Position |
| `E` | End Position |
| `.` | Empty Space |

### Level Organization

- Each level is created by combining multiple "titles" (level sections)
- Titles are stored as JSON files in the `levels` directory
- A level always begins with a start section and ends with an end section
- Middle sections are randomly selected based on the level difficulty

### Creating Custom Levels

You can create your own level titles by adding new JSON files to the `levels` directory. Each file should follow this format:

```json
{
  "title": "My Custom Level",
  "description": "A description of the level",
  "width": 20,
  "height": 8,
  "layout": [
    ".....................",
    "............C........",
    "..........BBBB.......",
    "........./........C..",
    "......../............",
    "...J.../....C........",
    "...B../...BBB........",
    "^..../..^....^......."
  ]
}
```

## Development

This game is built using:

- Three.js for 3D rendering
- Pure JavaScript (no frameworks)
- JSON for level data storage

## License

[MIT License](LICENSE) 