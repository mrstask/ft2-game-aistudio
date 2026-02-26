# Neural Link Asset Manager: Technical Specifications

## 1. Overview
The Neural Link Asset Manager is a developer-tier tool designed to calibrate and synchronize the visual representations of entities within the wasteland. It bridges the gap between raw entity data and high-fidelity 2.5D isometric sprites.

## 2. Core Requirements

### 2.1. Sprite Generation (Neural Sync)
- **Prompt Template**: Generates a 4-directional sprite sheet (Front, Back, Left, Right).
- **Style**: 90s isometric RPG (Fallout 1/2 aesthetic), pixel art, high contrast, gritty textures.
- **Output**: A single image containing the 4 cardinal directions for the entity.

### 2.2. Movement Models
Entities are categorized by their locomotion method, which influences their animation and sprite generation:
1. **Bipedal (2-Legged)**: Standard humanoids, mutants, and upright robots.
2. **Quadrupedal (4-Legged)**: Radroaches, hounds, and wasteland beasts.
3. **Mechanized (Wheels/Tracks)**: Sentry bots, transport drones, and automated platforms.
4. **Serpentine (Crawling)**: Slithering mutants or low-profile biological threats.

### 2.3. Entity Scaling
- NPCs support variable physical sizes (e.g., Small, Medium, Large, Colossal).
- The rendering engine scales sprites based on the entity's `size` property.

## 3. Implementation Flow

### 3.1. Asset Definition
1. Developer selects an entity in the **Asset Manager**.
2. Developer defines the **Movement Model** and **Base Prompt**.
3. Developer sets the **Scale Factor** (Size).

### 3.2. Neural Generation
1. Click **"Sync Neural Link"**.
2. The system constructs a composite prompt:
   `[Base Prompt] + [Movement Model Context] + [4-Directional Sheet Template]`.
3. The AI generates a 2.5D isometric sprite sheet.
4. The resulting URL is stored in the entity's `spriteUrl`.

### 3.3. Rendering Logic
1. `GameCanvas` reads the `spriteUrl`.
2. The engine applies a scale transform based on the entity's `size`.
3. (Future) The engine clips the sprite sheet based on the entity's current `facing` direction.

## 4. Prompt Template Structure
```text
Isometric 2D sprite sheet for a post-apocalyptic RPG. 
Subject: [Entity Name] - [Base Prompt].
Locomotion: [Movement Type].
Format: 4 cardinal directions (Front, Back, Left, Right) in a 2x2 grid.
Style: Gritty 90s pixel art, Fallout 1 aesthetic, 256-color palette, pure white background.
```
